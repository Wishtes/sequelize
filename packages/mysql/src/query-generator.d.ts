import type { EscapeOptions } from '@sequelize/core/_non-semver-use-at-your-own-risk_/abstract-dialect/query-generator-typescript.js';
import type { JsonTable } from '@sequelize/core/_non-semver-use-at-your-own-risk_/expression-builders/json-table.js';
import { MySqlQueryGeneratorTypeScript } from './query-generator-typescript.internal.js';

export class MySqlQueryGenerator extends MySqlQueryGeneratorTypeScript {
  jsonTable(piece: JsonTable, escapeOptions?: EscapeOptions): string;
}
