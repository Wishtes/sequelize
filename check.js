const fs = require('fs');
const path = 'packages/core/src/model.js';
let content = fs.readFileSync(path, 'utf8');

const staticMethods = [
  'aggregate', 'count', 'max', 'min', 'sum', 'findOne', 'findAll',
  'findAndCountAll', 'findByPk', 'create', 'findOrBuild', 'findOrCreate',
  'findCreateFind', 'upsert', 'bulkCreate', 'truncate', 'destroy', 'restore',
  'update'
];

const instanceMethods = [
  'save', 'reload', 'increment', 'decrement', 'update', 'destroy', 'restore'
];

function checkMethods(methods, isStatic) {
  methods.forEach(method => {
    const prefix = isStatic ? 'static async ' : 'async ';
    const regex = new RegExp('^(\\s*)(' + prefix + method + '\\s*\\(([^)]*)\\)\\s*\\{)', 'm');
    const match = content.match(regex);
    if (match) {
      // console.log("Found:", match[2]);
      if (!match[3].includes('options')) {
         console.log("WARNING: no options in", match[2]);
      }
    } else {
      console.log("NOT FOUND:", prefix + method);
    }
  });
}

checkMethods(staticMethods, true);
checkMethods(instanceMethods, false);
