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

// We want to insert `setTransactionFromCls(options, this.sequelize);` right after the open brace of the method, if `options` is a parameter.
// The regex: (static )?async methodName\(...options...\) {

function patchMethods(methods, isStatic) {
  methods.forEach(method => {
    const prefix = isStatic ? 'static async ' : 'async ';
    // Match exactly the method signature.
    // e.g. static async findAll(options) {
    const regex = new RegExp('^(\\s*)(' + prefix + method + '\\s*\\([^)]*\\)\\s*\\{)', 'm');
    content = content.replace(regex, (match, spaces, sig) => {
      // Check if it already has setTransactionFromCls immediately
      // Actually we just inject it safely. If options is not passed, wait! options is always an argument.
      // But let's check if the argument is actually called `options`.
      // The method signatures in sequelize usually are: (options), (values, options), (key, value, options)
      
      return match + '\n' + spaces + '  if (options !== undefined) setTransactionFromCls(options, this.sequelize);\n' +
                     spaces + '  else { options = {}; setTransactionFromCls(options, this.sequelize); }';
    });
  });
}

patchMethods(staticMethods, true);
patchMethods(instanceMethods, false);

fs.writeFileSync(path, content);
console.log("Patched model.js");
