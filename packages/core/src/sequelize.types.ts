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
   * Health check configuration for the connection pool.
   */
  healthCheck?: {
    /**
     * Mode of the health check:
     * - 'idle': Periodically checks idle connections in the pool.
     * - 'acquire': Checks the connection before returning it from `pool.acquire()`.
     * - 'both': Enables both 'idle' and 'acquire' modes.
     */
    mode?: 'idle' | 'acquire' | 'both';
    /**
     * Interval in milliseconds for 'idle' mode. Defaults to 30000.
     */
    interval?: number;
  } | undefined;
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
