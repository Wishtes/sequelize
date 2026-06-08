import type { AbstractDialect } from '../abstract-dialect/dialect.js';
import type { Expression } from '../sequelize.js';
import { DialectAwareFn } from './dialect-aware-fn.js';

export interface JsonTableColumn {
  name: string;
  type: string;
  path: string;
  onError?: 'ERROR' | 'NULL' | `DEFAULT ${string}`;
  onEmpty?: 'ERROR' | 'NULL' | `DEFAULT ${string}`;
}

/**
 * Do not use me directly. Use {@link sql.jsonTable}.
 *
 * Represents a MySQL JSON_TABLE expression, which converts JSON arrays/objects
 * into a relational table expression.
 *
 * **Supported dialect**: MySQL 8.0.4+
 *
 * @example
 * ```ts
 * sql.jsonTable(
 *   sql.attribute('data'),
 *   '$.items[*]',
 *   [
 *     { name: 'id', type: 'INT', path: '$.id' },
 *     { name: 'name', type: 'VARCHAR(255)', path: '$.name' },
 *   ],
 * )
 * ```
 *
 * will produce:
 *
 * ```sql
 * -- mysql
 * JSON_TABLE(`data`, '$.items[*]' COLUMNS (
 *   `id` INT PATH '$.id',
 *   `name` VARCHAR(255) PATH '$.name'
 * ))
 * ```
 */
export class JsonTable extends DialectAwareFn {
  readonly jsonExpression: Expression;
  readonly rootPath: string;
  readonly columns: readonly JsonTableColumn[];

  constructor(
    jsonExpression: Expression,
    rootPath: string,
    columns: readonly JsonTableColumn[],
  ) {
    super(jsonExpression);
    this.jsonExpression = jsonExpression;
    this.rootPath = rootPath;
    this.columns = columns;
  }

  get minArgCount() {
    return 1;
  }

  get maxArgCount() {
    return 1;
  }

  supportsDialect(dialect: AbstractDialect): boolean {
    return dialect.supports.jsonTable ?? false;
  }

  applyForDialect(dialect: AbstractDialect): string {
    return dialect.queryGenerator.jsonTableQuery(
      this.jsonExpression,
      this.rootPath,
      this.columns,
    );
  }
}

/**
 * Creates a JSON_TABLE expression.
 *
 * @param jsonExpression The JSON expression (e.g. a column containing JSON).
 * @param rootPath The root path for the JSON data (e.g. `'$.items[*]'`).
 * @param columns The column definitions for the JSON_TABLE.
 *
 * @example
 * ```ts
 * jsonTable(sql.attribute('data'), '$.items[*]', [
 *   { name: 'id', type: 'INT', path: '$.id' },
 *   { name: 'name', type: 'VARCHAR(255)', path: '$.name' },
 * ])
 * ```
 */
export function jsonTable(
  jsonExpression: Expression,
  rootPath: string,
  columns: readonly JsonTableColumn[],
): JsonTable {
  return new JsonTable(jsonExpression, rootPath, columns);
}