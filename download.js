const https = require('https');
const fs = require('fs');

https.get('https://raw.githubusercontent.com/sequelize/sequelize-pool/master/src/Pool.ts', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('/app/sequelize/pool.ts', data);
    console.log('done');
  });
});
