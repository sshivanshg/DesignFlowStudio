// Node.js script to add hasRole RBAC middleware to admin routes
import fs from 'fs';

// Read the routes file
const routesFile = './server/routes.ts';
let content = fs.readFileSync(routesFile, 'utf8');

// Get all routes with /api/admin/ prefix that don't have hasRole
const routeRegex = /app\.(get|post|put|delete)\("\/api\/admin\/[^"]+", isAuthenticated,(?! hasRole)/g;
let matches = content.match(routeRegex);

if (!matches) {
  console.log('No matching routes found.');
  process.exit(0);
}

console.log(`Found ${matches.length} routes to update`);

// Add hasRole middleware
matches.forEach(match => {
  const updated = match.replace('isAuthenticated,', 'isAuthenticated, hasRole([\'admin\']),');
  content = content.replace(match, updated);
});

// Remove redundant role checks
const redundantCheckRegex = /\/\/ Check if user is an admin\s+const user = req\.user as User;\s+if \(user\.role !== ['"]admin['"]\) {\s+return res\.status\(403\)\.json\({ message: ["'].*?["'] }\);\s+}/gs;
content = content.replace(redundantCheckRegex, '// Admin role is verified by the hasRole middleware');

// Write the updated content
fs.writeFileSync(routesFile, content);
console.log('Successfully added RBAC to admin routes');