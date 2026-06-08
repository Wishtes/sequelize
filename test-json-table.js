const { Sequelize, sql } = require('@sequelize/core');
const { MySqlDialect } = require('@sequelize/mysql');
const semver = require('semver');

async function run() {
  const sequelize = new Sequelize({
    dialect: MySqlDialect,
    database: 'test',
    username: 'root',
    password: 'password',
    host: 'localhost',
    port: 3306,
  });

  const queryGenerator = sequelize.dialect.queryGenerator;

  console.log('--- Test 1: Basic JSON_TABLE ---');
  const expr = sql.jsonTable({
    expression: sql.literal(`'[{"a": 1}, {"a": 2}]'`),
    path: '$[*]',
    columns: [
      { name: 'rowid', forOrdinality: true },
      { name: 'a_val', type: 'INT', path: '$.a', onEmpty: 0 }
    ],
    alias: 'jt'
  });
  console.log(queryGenerator.escape(expr));

  console.log('\n--- Test 2: Nested JSON_TABLE ---');
  const expr2 = sql.jsonTable({
    expression: sql.attribute('json_col'),
    path: '$[*]',
    columns: [
      { name: 'id', type: 'INT', path: '$.id' },
      {
        nested: {
          path: '$.items[*]',
          columns: [
            { name: 'item_name', type: 'VARCHAR(255)', path: '$.name' }
          ]
        }
      }
    ],
    alias: 'jt'
  });
  console.log(queryGenerator.escape(expr2));

  console.log('\n--- Test 3: Test MySQL < 8.0 throws ---');
  sequelize.setDatabaseVersion('5.7.0');
  try {
    queryGenerator.escape(expr);
    console.log('FAIL: Did not throw for 5.7.0');
  } catch(e) {
    console.log('SUCCESS: Threw error:', e.message);
  }

  console.log('\n--- Test 4: JSON_TABLE with JOIN, GROUP BY, ORDER BY ---');
  sequelize.setDatabaseVersion('8.0.19');
  
  // Create a model to test with QueryGenerator
  const User = sequelize.define('User', {
    name: { type: require('@sequelize/core').DataTypes.STRING },
    json_data: { type: require('@sequelize/core').DataTypes.JSON }
  }, { timestamps: false });

  // Try to generate a SELECT query joining with JSON_TABLE
  const selectQuery = queryGenerator.selectQuery('Users', {
    attributes: ['Users.name', 'jt.a_val'],
    // Mocking the FROM clause since JSON_TABLE can be put in JOIN or FROM
    // We can use it as a literal in JOIN
    tableAs: 'Users',
    joins: [
      {
         type: 'JOIN',
         target: expr,
         on: sql`1=1`
      }
    ],
    group: ['Users.name'],
    order: [['Users.name', 'DESC']]
  }, User);
  
  console.log(selectQuery);
}

run().catch(console.error);
