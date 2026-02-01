#!/bin/bash
# Complete cleanup workflow
# Location: /Users/sithumraigamage/projects/expense-tracker/cleanup-workflow.sh

set -e  # Exit on error

echo "🚀 Starting Workspace Cleanup Workflow"
echo "======================================"

# Step 0: Create reports directory
mkdir -p reports

# Step 1: Safety - Create cleanup branch
echo ""
echo "Step 1: Creating cleanup branch..."
git checkout -b feature/workspace-cleanup 2>/dev/null || git checkout feature/workspace-cleanup
git add -A
git commit -m "Pre-cleanup snapshot" || echo "Nothing to commit"

# Step 2: Dependency Audit
echo ""
echo "Step 2: Running dependency audit..."
echo "  Analyzing frontend dependencies..."
cd expensive-tracker-frontend
npx depcheck > ../reports/frontend-depcheck.txt 2>&1
echo "  Analyzing backend dependencies..."
cd ../expensive-tracker-backend
npx depcheck > ../reports/backend-depcheck.txt 2>&1
cd ..

echo "✅ Dependency reports generated in reports/"

# Step 3: Angular Dead Code Detection
echo ""
echo "Step 3: Analyzing Angular code..."
cd expensive-tracker-frontend

# Install ts-prune if not present
if ! npm list ts-prune --depth=0 >/dev/null 2>&1; then
  echo "  Installing ts-prune..."
  npm install -D ts-prune --silent
fi

echo "  Running ts-prune..."
npx ts-prune > ../reports/frontend-ts-prune.txt 2>&1 || true

# Install unimported if not present
if ! npm list unimported --depth=0 >/dev/null 2>&1; then
  echo "  Installing unimported..."
  npm install -D unimported --silent
fi

echo "  Running unimported..."
npx unimported > ../reports/frontend-unimported.txt 2>&1 || true
cd ..

echo "✅ Angular analysis complete"

# Step 4: Backend Orphaned Files
echo ""
echo "Step 4: Analyzing backend code..."
cd expensive-tracker-backend

# Install madge if not present
if ! npm list madge --depth=0 >/dev/null 2>&1; then
  echo "  Installing madge..."
  npm install -D madge --silent
fi

echo "  Finding orphaned files..."
npx madge --orphans src/server.js > ../reports/backend-orphans.txt 2>&1 || echo "No orphans found" > ../reports/backend-orphans.txt

echo "  Finding circular dependencies..."
npx madge --circular src/server.js > ../reports/backend-circular.txt 2>&1 || echo "No circular dependencies found" > ../reports/backend-circular.txt

echo "  Generating dependency graph..."
npx madge --json src/server.js > ../reports/backend-dependency-graph.json 2>&1 || true

cd ..

echo "✅ Backend analysis complete"

# Step 5: Create audit scripts if they don't exist
echo ""
echo "Step 5: Creating audit scripts..."

# Frontend image audit script
cat > expensive-tracker-frontend/audit-images.sh << 'IMGAUDIT'
#!/bin/bash
echo "=== Image Asset Audit ==="

# Find all images
echo "Image files in public:"
find public -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.svg" -o -name "*.gif" -o -name "*.webp" \) 2>/dev/null > all-images.txt || touch all-images.txt

if [ ! -s all-images.txt ]; then
  echo "No images found in public/ directory"
  rm all-images.txt
  exit 0
fi

cat all-images.txt

echo ""
echo "Checking usage in codebase..."
echo ""

# Check each image
while IFS= read -r image; do
  filename=$(basename "$image")
  # Search in HTML, TS, SCSS, and CSS files
  if ! grep -rq "$filename" src/ --include="*.html" --include="*.ts" --include="*.scss" --include="*.css" 2>/dev/null; then
    size=$(du -h "$image" 2>/dev/null | cut -f1)
    echo "  ⚠️  Unused: $image ($size)"
  fi
done < all-images.txt

# Calculate total size
echo ""
echo "Total size of images:"
du -sh public/ 2>/dev/null || echo "N/A"

rm all-images.txt
IMGAUDIT

chmod +x expensive-tracker-frontend/audit-images.sh

# Frontend SCSS audit script
cat > expensive-tracker-frontend/audit-scss.sh << 'SCSSAUDIT'
#!/bin/bash
echo "=== SCSS Variable Audit ==="

# Find all SCSS variable definitions
echo "Defined SCSS variables:"
grep -rh "^\$[a-zA-Z0-9_-]*:" src/ --include="*.scss" 2>/dev/null | sort -u > defined-vars.txt || touch defined-vars.txt

if [ ! -s defined-vars.txt ]; then
  echo "No SCSS variables found"
  rm defined-vars.txt
  exit 0
fi

cat defined-vars.txt

# Check each variable for usage
echo ""
echo "Unused SCSS variables:"
while IFS= read -r line; do
  var_name=$(echo "$line" | cut -d':' -f1 | xargs)
  # Count occurrences (should be > 1 if used, 1 if only defined)
  count=$(grep -r "$var_name" src/ --include="*.scss" 2>/dev/null | wc -l)
  if [ "$count" -eq 1 ]; then
    echo "  ⚠️  $var_name (defined but never used)"
  fi
done < defined-vars.txt

# Clean up
rm defined-vars.txt
SCSSAUDIT

chmod +x expensive-tracker-frontend/audit-scss.sh

# Run asset audits
echo "  Running image audit..."
cd expensive-tracker-frontend
./audit-images.sh > ../reports/unused-images.txt 2>&1
echo "  Running SCSS audit..."
./audit-scss.sh > ../reports/unused-scss.txt 2>&1
cd ..

echo "✅ Asset audit complete"

# Step 6: Generate Summary Report
echo ""
echo "Step 6: Generating summary report..."
cat > reports/cleanup-summary.md << 'SUMMARY'
# Workspace Cleanup Summary

**Generated:** $(date)

## Reports Generated

1. **Dependency Audit**
   - [Frontend Dependencies](frontend-depcheck.txt)
   - [Backend Dependencies](backend-depcheck.txt)

2. **Dead Code Analysis**
   - [Frontend TypeScript Unused Exports](frontend-ts-prune.txt)
   - [Frontend Unimported Files](frontend-unimported.txt)

3. **Backend Analysis**
   - [Orphaned Files](backend-orphans.txt)
   - [Circular Dependencies](backend-circular.txt)
   - [Dependency Graph](backend-dependency-graph.json)

4. **Asset Audit**
   - [Unused Images](unused-images.txt)
   - [Unused SCSS Variables](unused-scss.txt)

## Next Steps

1. Review each report carefully
2. Follow the safe removal process outlined in the cleanup strategy
3. **IMPORTANT:** Test after each removal!
4. Commit changes incrementally

## Quick Stats

### Before Cleanup
- Frontend Components: $(find expensive-tracker-frontend/src -name '*.component.ts' 2>/dev/null | wc -l)
- Frontend Services: $(find expensive-tracker-frontend/src -name '*.service.ts' 2>/dev/null | wc -l)
- Frontend Dependencies: $(jq '.dependencies | length' expensive-tracker-frontend/package.json 2>/dev/null || echo "N/A")
- Backend Dependencies: $(jq '.dependencies | length' expensive-tracker-backend/package.json 2>/dev/null || echo "N/A")

### Review Priority

1. **High Priority:** Unused dependencies (security & performance impact)
2. **Medium Priority:** Dead code (maintainability)
3. **Low Priority:** Unused assets (storage optimization)

---

**Remember:** Always test after each cleanup step!
SUMMARY

echo "✅ Summary report generated"

echo ""
echo "🎉 Cleanup analysis complete!"
echo ""
echo "📊 Review reports in: reports/"
echo "📖 Follow the cleanup strategy for safe removal"
echo ""
echo "Next steps:"
echo "  1. Review reports/cleanup-summary.md"
echo "  2. Start with dependency cleanup (highest impact)"
echo "  3. Test after each removal"
echo "  4. Commit incrementally"
