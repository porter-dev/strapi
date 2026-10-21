import path from 'path';
import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  const databaseUrl = env('DATABASE_URL', env('DB_URL'));

  if (!databaseUrl) {
    return {
      connection: {
        client: 'sqlite',
        connection: {
          filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
        },
        useNullAsDefault: true,
      },
    };
  }

  return {
    connection: {
      client: 'postgres',
      connection: postgresConnection(databaseUrl),
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};

/**
 * Applies libpq `sslmode` semantics, since node-postgres treats `require` as `verify-full`:
 * - `disable` or absent: plain connection
 * - `require`, `prefer`, `verify-ca`: encrypted, certificate not verified (managed databases such as RDS)
 * - `verify-full`: encrypted and verified against the system CA store
 */
function postgresConnection(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const sslmode = url.searchParams.get('sslmode') ?? 'disable';

  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    database: decodeURIComponent(url.pathname.slice(1)),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: sslmode === 'disable' ? false : { rejectUnauthorized: sslmode === 'verify-full' },
  };
}

export default config;
