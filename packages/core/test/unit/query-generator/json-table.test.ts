import { expect } from 'chai';
import { DataTypes, sql } from '@sequelize/core';
import { MySqlDialect } from '@sequelize/mysql';
import { sequelize } from '../../support.js';
import { getTestDialectTeaser } from '../../support.js';

const dialectName = sequelize.dialect.name;

describe(getTestDialectTeaser('QueryGenerator'), () => {
  if (dialectName !== 'mysql') {
    return;
  }

  describe('jsonTable', () => {
    const queryGenerator = sequelize.dialect.queryGenerator;

    it('generates a basic JSON_TABLE query', () => {
      const expr = sql.jsonTable({
        expression: sql.literal(`'[{"a": 1}, {"a": 2}]'`),
        path: '$[*]',
        columns: [
          { name: 'rowid', forOrdinality: true },
          { name: 'a_val', type: 'INT', path: '$.a', onEmpty: 0 }
        ],
        alias: 'jt'
      });

      const sqlString = queryGenerator.escape(expr);
      expect(sqlString).to.equal(
        `JSON_TABLE('[{"a": 1}, {"a": 2}]', '$[*]' COLUMNS (\`rowid\` FOR ORDINALITY, \`a_val\` INT PATH '$.a' DEFAULT 0 ON EMPTY)) AS \`jt\``
      );
    });

    it('generates a nested JSON_TABLE query', () => {
      const expr = sql.jsonTable({
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

      const sqlString = queryGenerator.escape(expr);
      expect(sqlString).to.equal(
        `JSON_TABLE(\`json_col\`, '$[*]' COLUMNS (\`id\` INT PATH '$.id', NESTED PATH '$.items[*]' COLUMNS (\`item_name\` VARCHAR(255) PATH '$.name'))) AS \`jt\``
      );
    });

    it('throws an error for MySQL version < 8.0.4', () => {
      // Temporarily mock the database version
      const originalGetVersion = sequelize.getDatabaseVersionIfExist;
      sequelize.getDatabaseVersionIfExist = () => '5.7.0';

      try {
        const expr = sql.jsonTable({
          expression: sql.literal(`'[]'`),
          path: '$[*]',
          columns: [{ name: 'id', type: 'INT' }]
        });

        expect(() => queryGenerator.escape(expr)).to.throw('JSON_TABLE is not supported in MySQL < 8.0.4');
      } finally {
        sequelize.getDatabaseVersionIfExist = originalGetVersion;
      }
    });

    it('can be used with JOIN, GROUP BY, and ORDER BY', () => {
      const User = sequelize.define('User', {
        name: DataTypes.STRING,
        json_data: DataTypes.JSON
      }, { timestamps: false });

      const expr = sql.jsonTable({
        expression: sql.attribute('json_data'),
        path: '$[*]',
        columns: [
          { name: 'a_val', type: 'INT', path: '$.a' }
        ],
        alias: 'jt'
      });

      const selectQuery = queryGenerator.selectQuery('Users', {
        attributes: ['Users.name', 'jt.a_val'],
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

      expect(selectQuery).to.include(`JOIN JSON_TABLE(\`Users\`.\`json_data\`, '$[*]' COLUMNS (\`a_val\` INT PATH '$.a')) AS \`jt\` ON 1=1`);
      expect(selectQuery).to.include(`GROUP BY \`Users\`.\`name\``);
      expect(selectQuery).to.include(`ORDER BY \`Users\`.\`name\` DESC`);
    });
  });
});
