import { BaseSqlExpression, SQL_IDENTIFIER } from './base-sql-expression.js';

export class Col extends BaseSqlExpression {
  declare protected readonly [SQL_IDENTIFIER]: 'col';

  readonly identifiers: string[];

  readonly jsonPath: ReadonlyArray<string | number> | null;

  constructor(identifiers: string | readonly string[], jsonPath?: ReadonlyArray<string | number>) {
    super();

    if (Array.isArray(identifiers)) {
      this.identifiers = [...identifiers];
    } else {
      this.identifiers = [identifiers];
    }

    if (jsonPath && jsonPath.length > 0) {
      this.jsonPath = jsonPath;
    } else if (
      this.identifiers.length === 1 &&
      typeof this.identifiers[0] === 'string'
    ) {
      const parsed = detectJsonPathFromString(this.identifiers[0]);
      if (parsed) {
        this.identifiers = [parsed.columnName];
        this.jsonPath = parsed.pathSegments;
      } else {
        this.jsonPath = null;
      }
    } else {
      this.jsonPath = null;
    }
  }
}

function detectJsonPathFromString(
  input: string,
): { columnName: string; pathSegments: ReadonlyArray<string | number> } | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const hasBracketNotation = /\[\d+\]/.test(input);
  if (!hasBracketNotation) {
    return null;
  }

  const pathSegments: Array<string | number> = [];
  let columnName = '';
  let currentToken = '';
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === '[') {
      if (columnName === '' && currentToken !== '') {
        columnName = currentToken;
        currentToken = '';
      } else if (currentToken !== '') {
        pathSegments.push(currentToken);
        currentToken = '';
      }

      const closeBracket = input.indexOf(']', i);
      if (closeBracket === -1) {
        return null;
      }

      const indexStr = input.slice(i + 1, closeBracket);
      const index = Number(indexStr);
      if (!Number.isInteger(index) || index < 0) {
        return null;
      }

      pathSegments.push(index);
      i = closeBracket + 1;
    } else if (char === '.') {
      if (columnName === '' && currentToken !== '') {
        columnName = currentToken;
      } else if (currentToken !== '') {
        pathSegments.push(currentToken);
      }

      currentToken = '';
      i++;
    } else {
      currentToken += char;
      i++;
    }
  }

  if (currentToken !== '') {
    if (columnName === '') {
      columnName = currentToken;
    } else {
      pathSegments.push(currentToken);
    }
  }

  if (pathSegments.length === 0) {
    return null;
  }

  return { columnName, pathSegments };
}

export function col(...identifiers: string[]): Col {
  if (identifiers.length === 1) {
    return new Col(identifiers[0]);
  }

  return new Col(identifiers);
}
