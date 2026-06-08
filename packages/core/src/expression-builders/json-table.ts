import type { AbstractDialect } from '../abstract-dialect/dialect.js';
import type { EscapeOptions } from '../abstract-dialect/query-generator-typescript.js';
import type { Expression } from '../sequelize.js';
import { BaseSqlExpression, SQL_IDENTIFIER } from './base-sql-expression.js';

export interface JsonTableColumn {
  name: string;
  type: string;
  path?: string;
  existsOnEmpty?: boolean;
}

export interface JsonTableOptions {
  alias?: string;
  path?: string;
}

export class JsonTable extends BaseSqlExpression {
  declare protected readonly [SQL_IDENTIFIER]: 'jsonTable';

  constructor(
    readonly jsonExpression: Expression,
    readonly columns: readonly JsonTableColumn[],
    readonly options: JsonTableOptions = {},
  ) {
    super();

    if (!Array.isArray(columns) || columns.length === 0) {
      throw new Error('jsonTable requires at least one column definition.');
    }
  }
}

export function jsonTable(
  jsonExpression: Expression,
  columns: readonly JsonTableColumn[],
  options?: JsonTableOptions,
): JsonTable {
  return new JsonTable(jsonExpression, columns, options);
}

export class JsonTableFn extends BaseSqlExpression {
  declare protected readonly [SQL_IDENTIFIER]: 'jsonTableFn';

  constructor(
    readonly jsonExpression: Expression,
    readonly columns: readonly JsonTableColumn[],
    readonly options: JsonTableOptions = {},
  ) {
    super();

    if (!Array.isArray(columns) || columns.length === 0) {
      throw new Error('jsonTable requires at least one column definition.');
    }
  }

  supportsDialect(dialect: AbstractDialect): boolean {
    return dialect.supports.jsonTable === true;
  }

  applyForDialect(dialect: AbstractDialect, options?: EscapeOptions): string {
    if (!this.supportsDialect(dialect)) {
      throw new Error(
        `JSON_TABLE is not supported by the ${dialect.name} dialect. It requires MySQL 8.0.4 or later.`,
      );
    }

    return dialect.queryGenerator.jsonTableQuery(this.jsonExpression, this.columns, this.options);
  }
}
