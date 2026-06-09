import type { PartialOrUndefined, StrictRequiredBy } from '@sequelize/utils';
import type { Connection } from './abstract-dialect/connection-manager.js';
import type {
  AbstractDialect,
  ConnectionOptions,
  DialectOptions,
} from './abstract-dialect/dialect.js';
import type { ReplicationPoolOptions } from './abstract-dialect/replication-pool.js';
import type {
  EphemeralSequelizeOptions,
  PersistedSequelizeOptions,
} from './sequelize.internals.js';
import type { NormalizedReplicationOptions } from './sequelize.js';

/**
 * Health check options for the connection pool.
 *
 * Used in {@link PoolOptions.healthCheck}
 */
export interface HealthCheckOptions<Dialect extends AbstractDialect> {
  /**
   * Enable or disable connection health checks.
   *
   * When enabled, Sequelize will periodically check idle connections and validate
   * connections when they are acquired from the pool. Invalid connections are
   * automatically removed and replaced with new ones.
   *
   * This is useful for detecting connections that have been broken due to
   * database server restarts, network interruptions, or other issues that
   * may not be detected by the synchronous `validate` function alone.
   *
   * @default true
   */
  enabled?: boolean | undefined;

  /**
   * The interval in milliseconds at which idle connections are checked for health.
   *
   * On each interval, a limited number of idle connections will be acquired from the pool,
   * tested with a lightweight SQL query (e.g. `SELECT 1+1`), and destroyed if the query fails.
   * The pool will automatically create new connections to replace the destroyed ones.
   *
   * Set to `0` or `Infinity` to disable idle health checks.
   *
   * @default 30000
   */
  idleCheckInterval?: number | undefined;

  /**
   * Enable or disable health checks when a connection is acquired from the pool.
   *
   * When enabled, after a connection is acquired from the pool (and passes the synchronous
   * `validate` check), an asynchronous health check query is executed. If the query fails,
   * the connection is destroyed and a new one is acquired automatically.
   *
   * This provides stronger guarantees than the synchronous `validate` alone, as it can
   * detect connections that appear valid but are actually broken (e.g., after a server restart).
   *
   * Note: Enabling this adds a small overhead to each connection acquisition.
   *
   * @default false
   */
  acquireCheck?: boolean | undefined;

  /**
   * A custom function that performs an asynchronous health check on a connection.
   *
   * If provided, this overrides the default health check implementation.
   * The function should return `true` if the connection is healthy, or `false` if it should be
   * removed from the pool.
   *
   * The default implementation executes a `SELECT 1+1` query (with the dialect-appropriate
   * dummy table if needed) on the connection.
   */
  healthCheck?: ((connection?: Connection<Dialect>) => Promise<boolean>) | undefined;
}

/**
 * Connection Pool options.
 *
 * Used in {@link SequelizeCoreOptions.pool}
 */
export interface PoolOptions<Dialect extends AbstractDialect>
  extends PartialOrUndefined<ReplicationPoolOptions> {
  /**
   * A function that validates a connection.
   *
   * If provided, this overrides the default connection validation built in to sequelize.
   */
  validate?: ((connection?: Connection<Dialect>) => boolean) | undefined;

  /**
   * Health check options for the connection pool.
   *
   * Health checks provide an additional layer of connection validation beyond the
   * synchronous `validate` function. They can execute actual SQL queries to verify
   * that a connection is truly alive, which is important for detecting connections
   * that have been broken due to database server restarts or network interruptions.
   *
   * Two modes are supported:
   * - **Idle check**: Periodically validates idle connections in the pool
   * - **Acquire check**: Validates connections when they are acquired from the pool
   *
   * @example
   * ```js
   * const sequelize = new Sequelize({
   *   pool: {
   *     healthCheck: {
   *       enabled: true,
   *       idleCheckInterval: 30000,
   *       acquireCheck: false,
   *     },
   *   },
   * });
   * ```
   */
  healthCheck?: HealthCheckOptions<Dialect> | undefined;
}

/**
 * Options of the {@link Sequelize} constructor used by the core library.
 *
 * See {@link Options} for the full list of options, including those dialect-specific.
 */
interface SequelizeCoreOptions<Dialect extends AbstractDialect>
  extends PersistedSequelizeOptions<Dialect>,
    EphemeralSequelizeOptions<Dialect> {}

/**
 * Options for the constructor of the {@link Sequelize} main class.
 */
export type Options<Dialect extends AbstractDialect> = SequelizeCoreOptions<Dialect> &
  Omit<DialectOptions<Dialect>, keyof SequelizeCoreOptions<AbstractDialect>> &
  Omit<ConnectionOptions<Dialect>, keyof SequelizeCoreOptions<AbstractDialect>>;

export type NormalizedOptions<Dialect extends AbstractDialect> = StrictRequiredBy<
  Omit<PersistedSequelizeOptions<Dialect>, 'replication'>,
  | 'transactionType'
  | 'noTypeValidation'
  | 'timezone'
  | 'disableClsTransactions'
  | 'defaultTransactionNestMode'
  | 'defaultTimestampPrecision'
> & {
  replication: NormalizedReplicationOptions<Dialect>;
};
