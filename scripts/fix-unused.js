const fs = require('fs');

const data = JSON.parse(fs.readFileSync('eslint_report.json', 'utf8'));
const files = data.filter(d => d.errorCount > 0 || d.warningCount > 0);

for (const fileData of files) {
  let content = fs.readFileSync(fileData.filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;

  const messages = fileData.messages
    .filter(m => m.ruleId === 'react/no-unescaped-entities' || 
                 (m.message.includes('is defined but never used') || m.message.includes('is assigned a value but never used')) && m.ruleId !== 'no-unused-vars')
    .sort((a, b) => b.line - a.line);

  for (const msg of messages) {
    const lineIndex = msg.line - 1;
    let line = lines[lineIndex];
    if (!line) continue;

    if (msg.ruleId === 'react/no-unescaped-entities') {
      line = line.replace(/"/g, '&quot;');
      line = line.replace(/'/g, '&apos;');
      lines[lineIndex] = line;
      modified = true;
    } else {
      const match = msg.message.match(/'([^']+)'/);
      if (match) {
        const varName = match[1];
        
        // Handle unused imports
        if (line.includes('import ') && line.includes(varName)) {
           // Replace exact word match surrounded by non-words (or start/end of line)
           const regex = new RegExp(`\\b${varName}\\b\\s*,?`, 'g');
           line = line.replace(regex, '');
           line = line.replace(/,\s*,/g, ',');
           line = line.replace(/\{\s*,\s*/g, '{ ');
           line = line.replace(/,\s*\}/g, ' }');
           
           if (line.match(/import\s*\{\s*\}\s*from/)) {
               lines.splice(lineIndex, 1);
           } else {
               lines[lineIndex] = line;
           }
           modified = true;
        } else {
            // Let's just prefix with underscore
            const regex = new RegExp(`\\b${varName}\\b`, 'g');
            lines[lineIndex] = line.replace(regex, `_${varName}`);
            modified = true;
        }
      }
    }
  }

  if (modified) {
    fs.writeFileSync(fileData.filePath, lines.join('\n'));
    console.log(`Auto-fixed imports/variables in: ${fileData.filePath}`);
  }
}
