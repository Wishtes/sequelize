import type { AbstractDialect, ConnectionOptions } from './dialect.js';

export interface GetConnectionOptions {
  /**
   * Set which replica to use. Available options are `read` and `write`
   */
  type: 'read' | 'write';

  /**
   * Force master or write replica to get connection from
   */
  useMaster?: boolean;
}

export interface AbstractConnection {
  /** The UUID of the transaction that is using this connection */
  // TODO: replace with the transaction object itself.
  uuid?: string | undefined;
}

declare const ConnectionType: unique symbol;
export type Connection<
  DialectOrConnectionManager extends AbstractDialect | AbstractConnectionManager,
> = DialectOrConnectionManager extends AbstractDialect
  ? Connection<DialectOrConnectionManager['connectionManager']>
  : DialectOrConnectionManager extends AbstractConnectionManager
    ? DialectOrConnectionManager[typeof ConnectionType]
    : never;

/**
 * Abstract Connection Manager
 *
 * Connection manager which handles pooling & replication.
 * Uses sequelize-pool for pooling
 *
 * @param connection
 */
export class AbstractConnectionManager<
  Dialect extends AbstractDialect = AbstractDialect,
  TConnection extends AbstractConnection = AbstractConnection,
> {
  declare [ConnectionType]: TConnection;

  protected readonly dialect: Dialect;

  constructor(dialect: Dialect) {
    this.dialect = dialect;
  }

  protected get sequelize() {
    return this.dialect.sequelize;
  }

  get pool(): never {
    throw new Error('The "pool" property has been moved to the Sequelize instance.');
  }

  /**
   * Determine if a connection is still valid or not
   *
   * @param _connection
   */
  validate(_connection: TConnection): boolean {
    throw new Error(`validate not implemented in ${this.constructor.name}`);
  }

  /**
   * Determine if a connection is healthy by executing a simple query
   *
   * @param connection
   */
  async healthCheck(connection: TConnection): Promise<boolean> {
    try {
      const dummyTableName = this.dialect.supports.select.dummyTable;
      const fromClause = dummyTableName
        ? ` FROM ${this.dialect.queryGenerator.quoteIdentifier(dummyTableName)}`
        : '';

      await this.sequelize.queryRaw(`SELECT 1+1 AS result${fromClause}`, {
        connection,
        raw: true,
        plain: true,
        type: 'SELECT',
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async connect(_config: ConnectionOptions<Dialect>): Promise<TConnection> {
    throw new Error(`connect not implemented in ${this.constructor.name}`);
  }

  async disconnect(_connection: TConnection): Promise<void> {
    throw new Error(`disconnect not implemented in ${this.constructor.name}`);
  }
}
