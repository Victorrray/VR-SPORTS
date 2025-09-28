const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(__dirname, 'src/components/betting/OddsTable.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix 4: Add export default at the end if missing
if (!content.includes('export default OddsTable')) {
  content = content.replace(/}(\s*)$/g, '}\n\nexport default OddsTable;\n');
}

// Write the changes back to the file
fs.writeFileSync(filePath, content);
console.log('Fixes applied to OddsTable.js');
