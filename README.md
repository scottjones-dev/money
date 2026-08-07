# UK Finance API

A TypeScript API for UK household finances and versioned tax, payroll, benefits, childcare, pension, budgeting, affordability, assessment, and debt-repayment estimates. It uses Hono, Better Auth, Drizzle ORM, PostgreSQL, Redis, and OpenAPI 3.1.

## Local setup

Requirements:

- Node.js 22 or newer
- pnpm 10.33.4 through Corepack
- PostgreSQL
- Redis

```powershell
Copy-Item .env.example .env
corepack pnpm install
corepack pnpm db:migrate
corepack pnpm dev
```

The API listens on `http://localhost:9000`. The combined auth-and-money OpenAPI document is at `/doc`, the money-only SDK contract is at `/doc/money`, and the interactive Scalar reference is at `/reference`.

Generate a Better Auth secret with at least 32 characters and supply valid PostgreSQL and Redis URLs before starting the API.

## Configuration

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | HTTP port; defaults to `9000` |
| `PUBLIC_BASE_URL` | Public API origin, such as `https://api.alicesystems.co.uk` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated exact frontend origins |
| `DATABASE_URL` | PostgreSQL connection URL |
| `DATABASE_SSL` | Enable PostgreSQL TLS |
| `REDIS_URL` | Redis URL for shared rate limits |
| `BETTER_AUTH_URL` | Better Auth base URL |
| `BETTER_AUTH_SECRET` | Better Auth signing secret, at least 32 characters |
| `DATA_ENCRYPTION_CURRENT_KEY_ID` | ID of the AES-256-GCM key used for new sensitive payloads |
| `DATA_ENCRYPTION_KEYS` | Comma-separated `keyId:base64Key` keyring; each decoded key must be 32 bytes |
| `LOG_LEVEL` | Pino log level |

`PUBLIC_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `REDIS_URL`, and `DATA_ENCRYPTION_KEYS` are mandatory in production. Keep old encryption keys in the keyring while rotating stored calculations and assessments. Development derives a local-only key from `BETTER_AUTH_SECRET` when no keyring is supplied.

## Database migrations

For a new database, apply all committed migrations:

```powershell
corepack pnpm db:migrate
```

Generate a migration after changing the Drizzle schema:

```powershell
corepack pnpm db:generate
```

### Adopting the baseline on the existing database

Do not run the initial migration normally against a database whose tables already exist.

1. Take and verify a restorable database backup.
2. Restore a copy into staging and run `corepack pnpm db:check`.
3. Point `DATABASE_URL` at the staged copy.
4. Run the guarded baseline adoption command:

```powershell
$env:BASELINE_CONFIRM='ADOPT_EXISTING_SCHEMA'
corepack pnpm db:baseline
Remove-Item Env:BASELINE_CONFIRM
```

The adoption command checks expected tables, columns, nullability, indexes, primary/foreign keys, and enum values. It aborts without recording the baseline when the schema differs. Repeat the process against production only after staging succeeds.

## API conventions

- Business routes live under `/v1` and require Better Auth sessions where appropriate.
- Nested financial resources are scoped to an authenticated household membership.
- List endpoints accept `page` and `pageSize` and return `{ data, pagination }`.
- `page` defaults to `1`; `pageSize` defaults to `20` and is capped at `100`.
- Errors use `{ error: { code, message, requestId, details? } }`.
- Anonymous, rate-limited calculators live under `/v1/calculators` and never persist their inputs.
- Household calculation previews are stored encrypted and remain side-effect free until `/calculations/{calculationId}/commit` is called.
- Money remains a decimal string throughout the API and generated SDK.

### Implemented money capabilities

- Household members, income sources, expenses, debts, debt payments, assets, employment profiles, pension pots, and recurring financial facts.
- Anonymous Income Tax, National Insurance, student-loan, pension-relief, and take-home pay estimators for 2022–23 through 2026–27.
- Stored previews for childcare, Child Maintenance Service, Universal Credit, aggregate UK benefit estimates, payroll, pensions, affordability, budgets, repayment plans, and financial-health assessments.
- The benefits assessment covers 42 national, statutory, legacy, and devolved schemes. It separates confirmed estimates from conditional official-assessment scenarios, loads the household's current encrypted facts by default, and never adds mutually exclusive scenarios to the confirmed total.
- Benefit commits create one calculation-owned income source per confirmed recurring award. Declared existing awards, one-off payments, referrals, and conditional scenarios are never duplicated.
- Versioned budgets, repayment plans, assessments, and encrypted household eligibility facts.

These outputs are estimates. They are not official benefit decisions, regulated financial advice, payroll/RTI processing, lending decisions, or payment execution. Assessment-dependent benefits show possible component rates without predicting the official outcome. Council Tax Reduction and discretionary local schemes must be calculated by the relevant authority.

## TypeScript SDK generation

The combined OpenAPI contract is committed at `openapi/openapi.json`. The deterministic money-only contract is committed at `openapi/money.openapi.json` and drives SDK generation. Better Auth operations are intentionally absent from the money SDK: use Better Auth's official client for sign-in and session handling.

Generate the Fetch-based TypeScript SDK into the gitignored `.tmp/sdk` directory and compile its usage fixture:

```powershell
corepack pnpm openapi:lint
corepack pnpm sdk:generate
corepack pnpm sdk:check
```

Browser clients must include the Better Auth session cookie:

```ts
import { createAuthClient } from "better-auth/client";
import { listHouseholds } from "@alicesystems/money-sdk";
import { client } from "@alicesystems/money-sdk/client";

const auth = createAuthClient({ baseURL: "http://localhost:9000" });
await auth.signIn.email({ email, password });

client.setConfig({
  baseUrl: "http://localhost:9000",
  credentials: "include",
});
```

Node clients must use a cookie jar or equivalent fetch wrapper that persists `Set-Cookie` values from sign-in responses and sends the cookie on later requests. The API does not support bearer authentication.

```ts
import makeFetchCookie from "fetch-cookie";
import { CookieJar } from "tough-cookie";
import { client } from "./.tmp/sdk/client.gen";

client.setConfig({
  baseUrl: "http://localhost:9000",
  fetch: makeFetchCookie(fetch, new CookieJar()) as typeof fetch,
});
```

SDK calls return typed `{ data, error }` results by default. `error.error.code` is the generated `ErrorCode` union, so consumers can switch on stable values such as `AUTHENTICATION_REQUIRED`, `HOUSEHOLD_NOT_FOUND`, and `VALIDATION_ERROR` with editor IntelliSense.

### SDK publication

`@alicesystems/money-sdk` is proprietary and publishes only from a GitHub Release tag formatted `sdk-vX.Y.Z`. The release workflow requires that the tag and package versions match, repeats all verification, inspects the tarball, and publishes with npm trusted publishing and provenance. Configure the npm package as a trusted publisher for this GitHub repository and the `npm` GitHub environment; no long-lived npm token is used.

To inspect a package locally without publishing:

```powershell
$env:SDK_VERSION='0.1.0'
corepack pnpm sdk:pack
Remove-Item Env:SDK_VERSION
```

## Cloudflare and Redis

Production client rate limits use Redis, with a process-local insurance limiter during Redis outages. Health responses report PostgreSQL and Redis status.

The application accepts `CF-Connecting-IP` for unauthenticated rate-limit identity and ignores generic forwarded headers. Restrict direct access to the origin server so only Cloudflare can reach it; otherwise proxy headers can be spoofed.

## Development commands

```powershell
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:integration
corepack pnpm check
corepack pnpm openapi:export
corepack pnpm openapi:lint
corepack pnpm sdk:check
corepack pnpm sdk:pack
corepack pnpm build
corepack pnpm start
```

Integration tests require Docker because they start disposable PostgreSQL and Redis containers. Production shutdown handles `SIGINT` and `SIGTERM` and closes HTTP, PostgreSQL, and Redis connections.
