#!/bin/bash
# Safe Delete Verification Script
# Usage: ./safe-delete-check.sh <file-path>

file_to_delete="$1"

if [ -z "$file_to_delete" ]; then
  echo "Usage: ./safe-delete-check.sh <file-path>"
  echo "Example: ./safe-delete-check.sh src/app/core/models/Target.ts"
  exit 1
fi

if [ ! -f "$file_to_delete" ]; then
  echo "❌ Error: File not found: $file_to_delete"
  exit 1
fi

filename=$(basename "$file_to_delete")
filename_no_ext="${filename%.*}"

echo "🔍 Safety Check for: $file_to_delete"
echo "=================================================="
echo ""

# Check 1: Direct filename references
echo "1️⃣  Checking for filename references..."
matches=$(grep -r "$filename" . \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=.git \
  --exclude-dir=.angular \
  --exclude="$filename" 2>/dev/null | wc -l | xargs)

if [ "$matches" -gt 0 ]; then
  echo "   ⚠️  Found $matches references to filename:"
  grep -r "$filename" . \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.git \
    --exclude-dir=.angular \
    --exclude="$filename" 2>/dev/null | head -5
  echo ""
else
  echo "   ✅ No filename references found"
  echo ""
fi

# Check 2: Class/export name references
echo "2️⃣  Checking for class/export references..."
class_name=$(grep -E "export (class|interface|type|const|function)" "$file_to_delete" 2>/dev/null | head -1 | sed 's/.*export [^ ]* \([A-Za-z]*\).*/\1/')

if [ -n "$class_name" ]; then
  echo "   Looking for: $class_name"
  class_matches=$(grep -r "\b$class_name\b" . \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.git \
    --exclude-dir=.angular \
    --exclude="$file_to_delete" 2>/dev/null | wc -l | xargs)
  
  if [ "$class_matches" -gt 0 ]; then
    echo "   ⚠️  Found $class_matches references to $class_name:"
    grep -r "\b$class_name\b" . \
      --exclude-dir=node_modules \
      --exclude-dir=dist \
      --exclude-dir=.git \
      --exclude-dir=.angular \
      --exclude="$file_to_delete" 2>/dev/null | head -5
    echo ""
  else
    echo "   ✅ No class references found"
    echo ""
  fi
else
  echo "   ℹ️  No exported class/interface found"
  echo ""
fi

# Check 3: Import statements
echo "3️⃣  Checking for import statements..."
import_matches=$(grep -r "from.*['\"].*$filename_no_ext['\"]" . \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=.git \
  --exclude-dir=.angular 2>/dev/null | wc -l | xargs)

require_matches=$(grep -r "require.*['\"].*$filename_no_ext['\"]" . \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=.git \
  --exclude-dir=.angular 2>/dev/null | wc -l | xargs)

total_imports=$((import_matches + require_matches))

if [ "$total_imports" -gt 0 ]; then
  echo "   ⚠️  Found $total_imports import/require statements:"
  grep -r "from.*['\"].*$filename_no_ext['\"]" . \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.git \
    --exclude-dir=.angular 2>/dev/null | head -3
  grep -r "require.*['\"].*$filename_no_ext['\"]" . \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.git \
    --exclude-dir=.angular 2>/dev/null | head -3
  echo ""
else
  echo "   ✅ No import statements found"
  echo ""
fi

# Check 4: Template references (for components)
if [[ "$filename" == *.component.ts ]]; then
  echo "4️⃣  Checking for component template usage..."
  
  # Extract selector
  selector=$(grep "selector:" "$file_to_delete" 2>/dev/null | sed "s/.*selector: *['\"\`]\([^'\"]*\).*/\1/")
  
  if [ -n "$selector" ]; then
    echo "   Looking for selector: <$selector>"
    selector_matches=$(grep -r "<$selector" . \
      --include="*.html" \
      --exclude-dir=node_modules \
      --exclude-dir=dist \
      --exclude-dir=.git 2>/dev/null | wc -l | xargs)
    
    if [ "$selector_matches" -gt 0 ]; then
      echo "   ⚠️  Found $selector_matches template usages:"
      grep -r "<$selector" . \
        --include="*.html" \
        --exclude-dir=node_modules \
        --exclude-dir=dist \
        --exclude-dir=.git 2>/dev/null | head -5
      echo ""
    else
      echo "   ✅ No template usage found"
      echo ""
    fi
  fi
fi

# Final verdict
echo "=================================================="
total_refs=$((matches + total_imports))

if [ "$total_refs" -eq 0 ] && [ "${class_matches:-0}" -eq 0 ]; then
  echo "✅ SAFE TO DELETE: $file_to_delete"
  echo ""
  echo "To delete, run:"
  echo "  git rm $file_to_delete"
  echo ""
  echo "Or to archive first:"
  echo "  mkdir -p archive/$(dirname $file_to_delete)"
  echo "  git mv $file_to_delete archive/$file_to_delete"
else
  echo "⚠️  NOT SAFE TO DELETE: File is still referenced"
  echo ""
  echo "Total references found: $total_refs"
  echo "Review the references above before deleting."
fi

echo "=================================================="
