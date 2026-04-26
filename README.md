# Talabix Monorepo

Talabix is a delivery marketplace monorepo built around a Laravel 13 modular monolith API, a shared React portal for merchants and internal ops, and Expo-based customer and rider apps.

## Workspaces

- `apps/api`: Laravel 13 API and realtime backend
- `apps/portal-web`: Vite React portal for merchant and ops staff
- `apps/customer-app`: Expo customer mobile app
- `apps/rider-app`: Expo rider mobile app
- `packages/shared`: shared JavaScript contracts, validators, API helpers, and realtime constants
- `docs`: ADRs, API conventions, and local development notes

## Quick start

1. `npm install`
2. `Copy-Item apps/api/.env.example apps/api/.env`
3. `Copy-Item .env.example .env`
4. `docker compose build`
5. `npm run prepare:docker`
6. `docker compose up -d mysql redis mailpit`
7. `docker compose up -d api worker scheduler reverb`
8. `npm run dev:portal`

For the mobile apps, run `npm run dev:customer` or `npm run dev:rider` in separate terminals after the root install completes.

The root `.env` controls host-facing Docker ports. By default MySQL is exposed on `33060` so local XAMPP or workstation MySQL services do not block the Talabix stack.

## Core architecture

- Modular monolith in Laravel with business modules under `app/Modules`
- Actor-specific API namespaces under `/api/v1/customer`, `/merchant`, `/rider`, and `/ops`
- Sanctum personal access tokens for every client
- Redis-backed queues, Horizon workers, and Reverb websocket server
- Shared enums and validation contracts in `@talabix/shared`

See [docs/local-dev/setup.md](./docs/local-dev/setup.md), [docs/ops/production-readiness.md](./docs/ops/production-readiness.md), [docs/ops/launch-evidence.md](./docs/ops/launch-evidence.md), [docs/ops/maps-provider-alert-drill.md](./docs/ops/maps-provider-alert-drill.md), [docs/ops/mysql-backup-restore-drill.md](./docs/ops/mysql-backup-restore-drill.md), and [docs/adr/0001-modular-monolith.md](./docs/adr/0001-modular-monolith.md) for the repo-level decisions and operating runbooks.

Before promoting staging to production traffic, fill the launch evidence record and run `npm run launch:preflight`. Use `npm run launch:local-checks` to run the local app gate: lint, i18n audit, shared/client tests, portal/customer/rider browser e2e, workspace builds, and API Pint/PHPStan/tests in the PHP 8.3 Docker container. Use `npm run launch:workbench` first when evidence is blocked; it prints the current launch areas, runbook status, and the external access checklist Ops must satisfy before drills can pass. Set `TALABIX_PREFLIGHT_PHP_VERSION` to the PHP runtime version used for API verification, for example `8.3.2`, so the check can enforce the API runtime gate without spawning local PHP processes. In PowerShell, run `$env:TALABIX_PREFLIGHT_PHP_VERSION='8.3.2'; npm.cmd run launch:preflight`; in POSIX shells, run `TALABIX_PREFLIGHT_PHP_VERSION=8.3.2 npm run launch:preflight`.
