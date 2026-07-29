#!/bin/bash
# Workspace Cleanup Metrics Tracker
# Location: /Users/sithumraigamage/projects/expense-tracker/cleanup-metrics.sh

echo "=== Workspace Cleanup Metrics ==="
echo "Generated: $(date)"
echo ""

# Frontend metrics
echo "📱 Frontend (Angular):"
echo "  Components: $(find expensive-tracker-frontend/src -name '*.component.ts' 2>/dev/null | wc -l | xargs)"
echo "  Services: $(find expensive-tracker-frontend/src -name '*.service.ts' 2>/dev/null | wc -l | xargs)"
echo "  Pipes: $(find expensive-tracker-frontend/src -name '*.pipe.ts' 2>/dev/null | wc -l | xargs)"
echo "  Directives: $(find expensive-tracker-frontend/src -name '*.directive.ts' 2>/dev/null | wc -l | xargs)"
echo "  Guards: $(find expensive-tracker-frontend/src -name '*.guard.ts' 2>/dev/null | wc -l | xargs)"
echo "  Dependencies: $(jq '.dependencies | length' expensive-tracker-frontend/package.json 2>/dev/null || echo "N/A")"
echo "  DevDependencies: $(jq '.devDependencies | length' expensive-tracker-frontend/package.json 2>/dev/null || echo "N/A")"

if [ -d "expensive-tracker-frontend/node_modules" ]; then
  echo "  node_modules size: $(du -sh expensive-tracker-frontend/node_modules 2>/dev/null | cut -f1)"
else
  echo "  node_modules size: Not installed"
fi

echo "  Source code size: $(du -sh expensive-tracker-frontend/src 2>/dev/null | cut -f1)"

if [ -d "expensive-tracker-frontend/dist" ]; then
  echo "  Build output size: $(du -sh expensive-tracker-frontend/dist 2>/dev/null | cut -f1)"
else
  echo "  Build output size: Not built"
fi

echo ""
echo "🔧 Backend (Node.js):"
echo "  Route files: $(find expensive-tracker-backend/src -name '*route*.js' -o -name '*router*.js' 2>/dev/null | wc -l | xargs)"
echo "  Controller files: $(find expensive-tracker-backend/src -name '*controller*.js' 2>/dev/null | wc -l | xargs)"
echo "  Model files: $(find expensive-tracker-backend/src -name '*model*.js' 2>/dev/null | wc -l | xargs)"
echo "  Middleware files: $(find expensive-tracker-backend/src -name '*middleware*.js' 2>/dev/null | wc -l | xargs)"
echo "  Utility files: $(find expensive-tracker-backend/src -name '*util*.js' -o -name '*helper*.js' 2>/dev/null | wc -l | xargs)"
echo "  Dependencies: $(jq '.dependencies | length' expensive-tracker-backend/package.json 2>/dev/null || echo "N/A")"
echo "  DevDependencies: $(jq '.devDependencies | length' expensive-tracker-backend/package.json 2>/dev/null || echo "N/A")"

if [ -d "expensive-tracker-backend/node_modules" ]; then
  echo "  node_modules size: $(du -sh expensive-tracker-backend/node_modules 2>/dev/null | cut -f1)"
else
  echo "  node_modules size: Not installed"
fi

echo "  Source code size: $(du -sh expensive-tracker-backend/src 2>/dev/null | cut -f1)"

echo ""
echo "📦 Total Project:"
echo "  Total size (excluding node_modules): $(du -sh --exclude=node_modules . 2>/dev/null | cut -f1)"
echo "  Total size (including node_modules): $(du -sh . 2>/dev/null | cut -f1)"
echo "  Git repository size: $(du -sh .git 2>/dev/null | cut -f1)"

echo ""
echo "📊 File Counts:"
echo "  Total TypeScript files: $(find . -name '*.ts' -not -path '*/node_modules/*' 2>/dev/null | wc -l | xargs)"
echo "  Total JavaScript files: $(find . -name '*.js' -not -path '*/node_modules/*' 2>/dev/null | wc -l | xargs)"
echo "  Total HTML files: $(find . -name '*.html' -not -path '*/node_modules/*' 2>/dev/null | wc -l | xargs)"
echo "  Total SCSS/CSS files: $(find . \( -name '*.scss' -o -name '*.css' \) -not -path '*/node_modules/*' 2>/dev/null | wc -l | xargs)"

echo ""
echo "🖼️  Assets:"
if [ -d "expensive-tracker-frontend/public" ]; then
  echo "  Images: $(find expensive-tracker-frontend/public -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.svg' -o -name '*.gif' -o -name '*.webp' \) 2>/dev/null | wc -l | xargs)"
  echo "  Assets size: $(du -sh expensive-tracker-frontend/public 2>/dev/null | cut -f1)"
else
  echo "  No public assets directory found"
fi

echo ""
echo "🧪 Test Coverage:"
if [ -d "expensive-tracker-frontend/coverage" ]; then
  echo "  Frontend coverage: Available"
else
  echo "  Frontend coverage: Not generated"
fi

if [ -d "expensive-tracker-backend/coverage" ]; then
  echo "  Backend coverage: Available"
else
  echo "  Backend coverage: Not generated"
fi
