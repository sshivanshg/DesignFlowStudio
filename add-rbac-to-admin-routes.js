const fs = require('fs');
const path = require('path');

// Read the routes file
const routesPath = path.join(__dirname, 'server', 'routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

// Pattern to match admin routes without hasRole middleware
const routePattern = /app\.(get|post|put|patch|delete)\("\/api\/admin\/[^"]+", isAuthenticated, async/g;

// Update routes to include hasRole middleware
content = content.replace(routePattern, (match) => {
  return match.replace('isAuthenticated, async', 'isAuthenticated, hasRole([\'admin\']), async');
});

// Pattern to match redundant admin role checks
const redundantCheckPattern = /\/\/ Check if user is an admin\s+const user = req\.user as User;\s+if \(user\.role !== ['"]admin['"]\) {\s+return res\.status\(403\)\.json\({ message: ["'].*["'] }\);\s+}/g;

// Replace redundant role checks with a comment
content = content.replace(redundantCheckPattern, '// Admin role is verified by the hasRole middleware');

// Write the updated content back to the file
fs.writeFileSync(routesPath, content, 'utf8');

console.log('Added RBAC to admin routes and removed redundant role checks.');