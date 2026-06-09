import type { AbstractDialect, ConnectionOptions } from './dialect.js';
import { QueryTypes } from '../enums.js';

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
   * Perform an asynchronous health check on a connection by executing a lightweight SQL query.
   *
   * Unlike the synchronous {@link validate} method which only checks connection properties,
   * this method executes an actual query against the database to verify the connection is
   * truly alive. This is essential for detecting connections that have been broken due to
   * database server restarts, network interruptions, or other issues that may not be
   * reflected in the connection's internal state.
   *
   * The default implementation executes a `SELECT 1+1` query, using the dialect-appropriate
   * dummy table if needed (e.g., `DUAL` for Oracle, `SYSIBM.SYSDUMMY1` for IBMi).
   * Dialect implementations can override this method to provide a more efficient
   * or dialect-specific health check.
   *
   * @param connection The connection to check
   * @returns `true` if the connection is healthy, `false` if it should be removed from the pool
   */
  async healthCheck(connection: TConnection): Promise<boolean> {
    try {
      const dummyTableName = this.dialect.supports.select.dummyTable;
      const fromClause = dummyTableName
        ? ` FROM ${this.sequelize.queryGenerator.quoteIdentifier(dummyTableName)}`
        : '';

      await this.sequelize.queryRaw(`SELECT 1+1 AS result${fromClause}`, {
        connection,
        type: QueryTypes.SELECT,
        logging: false,
        retry: { max: 0 },
      });

      return true;
    } catch {
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
