# Strapi on Porter

A minimal Strapi 5 headless CMS project, ready to deploy on Porter with Postgres.

## What's inside

- Node.js 24 (LTS), Strapi 5.59 (TypeScript), npm
- Postgres when `DATABASE_URL` (or `DB_URL`) is set, SQLite in `.tmp/data.db` otherwise
- `GET /` redirects to the admin panel at `/admin`
- `GET /_health` returns `204 No Content`, Strapi's built-in health check
- Content API under `/api`

## Run locally

Requires Node.js 24. Copy `.env.example` to `.env` and fill in the secrets (see [Configuration](#configuration)), then:

```bash
npm install
npm run develop
```

Open http://localhost:1337/admin and create the first admin user. Content types you build in development mode are written to `src/api`, commit them to deploy them.

To use Postgres instead of SQLite locally:

```bash
docker compose up -d
DATABASE_URL=postgres://strapi:strapi@localhost:5432/strapi npm run develop
```

With Docker:

```bash
docker build -t strapi . && docker run -p 1337:1337 --env-file .env strapi
```

## Deploy on Porter

### 1. Create the secrets

Strapi refuses to start without its secrets. Create an environment group holding them:

```bash
porter env create --name strapi-secrets \
  -s APP_KEYS="$(openssl rand -hex 32),$(openssl rand -hex 32)" \
  -s API_TOKEN_SALT="$(openssl rand -hex 32)" \
  -s ADMIN_JWT_SECRET="$(openssl rand -hex 32)" \
  -s TRANSFER_TOKEN_SALT="$(openssl rand -hex 32)" \
  -s JWT_SECRET="$(openssl rand -hex 32)" \
  -s ENCRYPTION_KEY="$(openssl rand -hex 32)"
```

You can also create it from the **Env Groups** tab in the dashboard.

### 2. Create a Postgres datastore

Create a Postgres datastore from **Add-ons** in the dashboard ([docs](https://docs.porter.run/addons/datastores)). Porter creates an environment group with the same name as the datastore. Its `DB_URL` secret is read automatically, so no mapping is needed. If you bring your own database, set `DATABASE_URL` instead.

Without a datastore the app falls back to SQLite on the container's disk, which is wiped on every deploy.

### 3. Deploy

Attach both environment groups (`strapi-secrets` and your datastore's group) to the app, either when creating it in the dashboard or by adding them to `porter.yaml`:

```yaml
envGroups:
  - strapi-secrets
  - my-postgres
```

*From the dashboard*: fork this repo, then in https://dashboard.porter.run create a new app from your GitHub repo. Porter reads `porter.yaml`, builds the Dockerfile, and opens a PR adding a GitHub Actions workflow. Merge it and every push to `main` redeploys. See https://docs.porter.run/applications/deploy/deploy-from-github-repo

*From the CLI*: [install the CLI](https://docs.porter.run/cli/installation), then:

```bash
porter auth login
porter apply -f porter.yaml
```

Database migrations run automatically when Strapi starts. Uploaded media is stored on the container's local disk and is lost on redeploy, so configure an upload provider such as [`@strapi/provider-upload-aws-s3`](https://docs.strapi.io/cms/configurations/media-library-providers/amazon-s3) before storing real media.

## Configuration

`porter.yaml` defines a single `web` service that runs `npm run start` on port `1337` with 1 CPU and 2048 MB of RAM, which leaves headroom for the admin panel. The health check probes `/_health`. See the [porter.yaml reference](https://docs.porter.run/applications/configuration-as-code/reference) for every field.

Generate each secret with `openssl rand -hex 32`.

| Name | Required | Description |
| --- | --- | --- |
| `APP_KEYS` | Yes | Comma separated keys used to sign session cookies |
| `API_TOKEN_SALT` | Yes | Salt for API tokens |
| `ADMIN_JWT_SECRET` | Yes | Secret for admin panel JWTs |
| `TRANSFER_TOKEN_SALT` | Yes | Salt for data transfer tokens |
| `JWT_SECRET` | Yes | Secret for Users and Permissions plugin JWTs |
| `ENCRYPTION_KEY` | Yes | Key used to encrypt stored secrets such as API tokens |
| `DATABASE_URL` | No | Postgres connection string. Falls back to `DB_URL`, then SQLite |
| `DB_URL` | No | Set by a Porter Postgres datastore environment group |
| `PORT` | No | Port to listen on, defaults to `1337` |
| `HOST` | No | Interface to bind, defaults to `0.0.0.0` |

The connection string's `sslmode` follows Postgres semantics: `require` encrypts without verifying the certificate (what managed databases such as RDS need), `verify-full` also verifies it, and no `sslmode` connects without TLS.

## Learn more

- https://docs.porter.run/getting-started/quickstart
- https://docs.porter.run/applications/configuration-as-code/overview
- https://docs.porter.run/applications/configure/environment-groups
- https://docs.porter.run/addons/datastores
- https://docs.porter.run/preview-environments/overview
- https://github.com/porter-dev/starters
