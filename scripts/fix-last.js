const fs = require('fs');

const data = JSON.parse(fs.readFileSync('eslint_report.json', 'utf8'));
const files = data.filter(d => d.errorCount > 0 || d.warningCount > 0);

for (const fileData of files) {
  let content = fs.readFileSync(fileData.filePath, 'utf8');
  let lines = content.split('\n');
  let modified = false;

  const messages = fileData.messages
    .filter(m => m.ruleId === 'react-hooks/exhaustive-deps')
    .sort((a, b) => b.line - a.line);

  for (const msg of messages) {
    const lineIndex = msg.line - 1;
    let line = lines[lineIndex];
    if (!line) continue;

    const match = msg.message.match(/missing dependenc(?:y|ies): (.*?)\./);
    if (match) {
        const deps = match[1].split(', ').map(d => d.replace(/'/g, '').replace(/ and /g, ''));
        
        // Find the bracket on previous lines
        let ptr = lineIndex;
        while(ptr > 0 && !lines[ptr].includes(']')) {
            ptr--;
        }

        if (lines[ptr] && lines[ptr].includes(']')) {
             const parts = lines[ptr].split(']');
             // We just add them before the bracket
             const prefix = parts[0].trim().endsWith('[') ? '' : ', ';
             
             let toAdd = [];
             deps.forEach(d => {
                 const cleanD = d.trim();
                 if (cleanD && !parts[0].includes(cleanD)) {
                     toAdd.push(cleanD);
                 }
             });

             if (toAdd.length > 0) {
                 lines[ptr] = parts[0] + prefix + toAdd.join(', ') + ']' + parts[1];
                 modified = true;
             }
        }
    }
  }

  if (modified) {
    fs.writeFileSync(fileData.filePath, lines.join('\n'));
    console.log(`Auto-fixed hooks in: ${fileData.filePath}`);
  }
}
