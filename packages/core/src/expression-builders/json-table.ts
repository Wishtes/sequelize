import type { AbstractDialect } from '../abstract-dialect/dialect.js';
import type { EscapeOptions } from '../abstract-dialect/query-generator-typescript.js';
import type { Expression } from '../sequelize.js';
import { DialectAwareFn } from './dialect-aware-fn.js';

export type JsonTableColumn =
  | { name: string; forOrdinality: true; nested?: undefined }
  | {
      name: string;
      type: string;
      path?: string;
      onEmpty?: Expression;
      errorOnEmpty?: boolean;
      onError?: Expression;
      errorOnError?: boolean;
      forOrdinality?: false;
      nested?: undefined;
    }
  | {
      nested: {
        path: string;
        columns: JsonTableColumn[];
      };
      name?: undefined;
      forOrdinality?: undefined;
    };

export interface JsonTableOptions {
  expression: Expression;
  path: string;
  columns: JsonTableColumn[];
  alias?: string;
}

export class JsonTable extends DialectAwareFn {
  readonly options: JsonTableOptions;

  constructor(options: JsonTableOptions) {
    super(options.expression);
    this.options = options;
  }

  get minArgCount() {
    return 1;
  }

  get maxArgCount() {
    return 1;
  }

  supportsDialect(dialect: AbstractDialect): boolean {
    return dialect.name === 'mysql';
  }

  applyForDialect(dialect: AbstractDialect, options?: EscapeOptions): string {
    if (dialect.name === 'mysql') {
      // @ts-expect-error -- jsonTable is added to MySqlQueryGenerator but not strongly typed on AbstractQueryGenerator
      return dialect.queryGenerator.jsonTable(this, options);
    }
    throw new Error(`JSON_TABLE is not supported by ${dialect.name} dialect.`);
  }
}

export function jsonTable(options: JsonTableOptions): JsonTable {
  return new JsonTable(options);
}
