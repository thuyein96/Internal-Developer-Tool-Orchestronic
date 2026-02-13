const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files in src directory
const files = glob.sync('src/**/*.ts', { 
  ignore: ['**/*.spec.ts', '**/*.test.ts', '**/node_modules/**'] 
});

let totalFixed = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Find all imports that start with 'src/'
  const importRegex = /from ['"]src\/([^'"]+)['"]/g;
  let matches = [...content.matchAll(importRegex)];
  
  if (matches.length === 0) return;
  
  // Calculate relative path from current file to src root
  const fileDir = path.dirname(filePath);
  const relativePath = path.relative(fileDir, 'src');
  
  // Replace each absolute import with relative import
  matches.forEach(match => {
    const fullMatch = match[0];
    const importPath = match[1];
    
    // Build the relative path
    let relativeImport;
    if (relativePath === '') {
      relativeImport = `./${importPath}`;
    } else {
      relativeImport = `${relativePath}/${importPath}`.replace(/\\/g, '/');
      if (!relativeImport.startsWith('.')) {
        relativeImport = './' + relativeImport;
      }
    }
    
    const newImport = `from '${relativeImport}'`;
    content = content.replace(fullMatch, newImport);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed++;
    console.log(`Fixed ${matches.length} imports in ${filePath}`);
  }
});

console.log(`\nTotal files fixed: ${totalFixed}`);
