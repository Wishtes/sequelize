import fs from 'fs';
const content = fs.readFileSync('packages/core/src/model.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('setTransactionFromCls')) {
    // find the previous line that starts with '  static async ' or '  async '
    for (let j = i; j >= 0; j--) {
      if (lines[j].includes(' async ')) {
        console.log(`Line ${i + 1} inside: ${lines[j].trim()}`);
        break;
      }
    }
  }
});
