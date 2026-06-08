import fs from 'fs';
const lines = fs.readFileSync('packages/core/src/model.js', 'utf8').split('\n');
lines.forEach((line, i) => {
  if (line.includes('setTransactionFromCls')) {
    console.log(`${i + 1}: ${line}`);
  }
});
