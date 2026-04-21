# Launch Evidence Record

This record is the source of truth for pre-launch operational proof. Keep raw secrets, passwords, access keys, private DSNs, customer data, and full database dumps out of this file. Link to restricted console screenshots or incident-tool records when evidence cannot be safely copied into git.

## Required Before Production Traffic

| Area                  | Required evidence                                           | Status  | Owner | Evidence link or note                                                                                                                                                                                                                                                                                       |
| --------------------- | ----------------------------------------------------------- | ------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Staging deployment    | Successful staging deploy, migrations, and smoke checks     | Pass    | Ops   | Deployed to https://smartcedra.online/talabix on 2026-04-21T16:06:43+03:00 from commit `3d5b1c9`; root site smoke check still returned 200                                                                                                                                                                  |
| Baseline monitoring   | Uptime, error-rate, queue, failed-job, scheduler, DB, Redis | Blocked | Ops   | Local service checks passed for Nginx, PHP-FPM, MariaDB, Redis, and Talabix queue/scheduler systemd services; keyed readiness confirms Redis-backed cache and queue. Blocked: monitoring provider, log drain, uptime/error/queue dashboard links, and alert destination are not available in this workspace |
| Maps provider alerts  | Provider dashboard alerts and fallback log-drain drill      | Blocked | Ops   | Blocked: staging key, provider dashboard links, and log-drain monitor links are not available in this workspace                                                                                                                                                                                             |
| Dispatch SLA alerting | Log-drain monitor and successful alert drill                | Blocked | Ops   | Blocked: staging log-drain monitor, alert destination, and synthetic staging order access are not available in this workspace                                                                                                                                                                               |
| MySQL restore drill   | Backup archive restored into a disposable database          | Blocked | Ops   | Local disposable restore passed on XAMPP MariaDB; see MySQL Restore Drill Evidence below. Blocked for launch: no staging backup disk/archive, disposable staging restore database, or maintenance host access is available in this workspace                                                                |
| Incident drill        | P0/P1 response walkthrough with roles and follow-up issue   | Blocked | Ops   | Blocked: staging incident channel/tool, participant roster, and follow-up issue tracker links are not available in this workspace                                                                                                                                                                           |

## Latest CI Gate Evidence

| Field                  | Value                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Gate date              | 2026-04-21T15:25:33+03:00                                                                                          |
| Branch                 | `codex/design`                                                                                                     |
| Commit                 | `d7ca0d7`                                                                                                          |
| GitHub Actions run     | https://github.com/abdelkarimhamd/Talabix/actions/runs/24722425385                                                 |
| API job result         | Pass: Composer install, env/key setup, MySQL migrations/seeds, Pint, PHPStan, and `php artisan test` on PHP 8.3    |
| Clients job result     | Pass: npm install, Playwright browser setup, lint, i18n audit, workspace tests, customer e2e, and artifact uploads |
| PHPStan baseline guard | Pass: `apps/api/phpstan-baseline.neon` absent; CI guard is active                                                  |
| Staging deployment     | Pass: manual native VM deployment completed under `/talabix` without taking over the existing root site            |
| Result                 | Pass for CI gate and staging deployment; remaining evidence rows still Blocked                                     |

## Staging Deployment Evidence

| Field                | Value                                                                                                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deployment date      | 2026-04-21T16:06:43+03:00                                                                                                                                                                                             |
| Target URL           | https://smartcedra.online/talabix                                                                                                                                                                                     |
| Host                 | Ubuntu 24.04.2 VM at `153.92.1.150`; existing `smartcedra.online` root app kept in place                                                                                                                              |
| Source               | `codex/design` commit `3d5b1c9`                                                                                                                                                                                       |
| Deploy path          | `/var/www/talabix/current`                                                                                                                                                                                            |
| Runtime              | Native PHP 8.3 FPM, MariaDB 10.11, Redis 7.0 on localhost, Node 20, Nginx                                                                                                                                             |
| Isolation approach   | Added scoped Nginx `location` blocks for `/talabix`, `/talabix/assets`, `/talabix/api`, `/talabix/up`, and `/talabix/storage` only                                                                                    |
| Migrations and seeds | Pass: all API migrations ran and seeders completed on the isolated `talabix` database                                                                                                                                 |
| Portal build         | Pass: `VITE_BASE_PATH=/talabix/ npm --workspace @talabix/portal-web run build`                                                                                                                                        |
| API health           | Pass: `https://smartcedra.online/talabix/up` returned HTTP 200                                                                                                                                                        |
| API readiness        | Pass: keyed `https://smartcedra.online/talabix/api/v1/readiness` returned HTTP 200 with `status=ready`, cache store `redis`, and queue `redis`                                                                        |
| Portal smoke         | Pass: `https://smartcedra.online/talabix/` and `https://smartcedra.online/talabix/merchant/orders` returned HTTP 200                                                                                                  |
| Browser smoke        | Pass: Playwright loaded the live portal with one rendered `#root` child and zero console/page errors; local screenshot `tmp/talabix-live.png`                                                                         |
| Existing root smoke  | Pass: `https://smartcedra.online/` still returned HTTP 200 after the `/talabix` deployment                                                                                                                            |
| Background services  | Pass: `redis-server`, `talabix-queue.service`, `talabix-scheduler.service`, `php8.3-fpm`, `nginx`, and `mariadb` reported `active`; queue worker runs `php artisan queue:work redis --sleep=3 --tries=3 --timeout=90` |
| Known limitation     | Reverb is not active in this native deployment; readiness reports Reverb as skipped because `BROADCAST_CONNECTION=log`                                                                                                |
| Result               | Pass                                                                                                                                                                                                                  |

## Maps Provider Alert Evidence

Run [maps-provider-alert-drill.md](./maps-provider-alert-drill.md) in staging after the provider dashboard and log-drain monitors are created.

| Field                                   | Value                                                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Drill date                              | 2026-04-20T12:35:33+03:00                                                                                                             |
| Environment                             | Local maintenance shell; staging unavailable from workspace                                                                           |
| Maps provider                           | `google_maps` configured; no API key configured                                                                                       |
| Provider project                        | Blocked: not recorded                                                                                                                 |
| Places API enabled                      | Blocked: provider dashboard link/access unavailable                                                                                   |
| Distance Matrix API enabled             | Blocked: provider dashboard link/access unavailable                                                                                   |
| Quota alert link                        | Blocked: not recorded                                                                                                                 |
| Provider error-rate alert link          | Blocked: not recorded                                                                                                                 |
| Billing or budget alert link            | Blocked: not recorded                                                                                                                 |
| Log-drain rule name                     | Blocked: not recorded                                                                                                                 |
| Alert destination                       | Blocked: not recorded                                                                                                                 |
| Rule match fields                       | `event=google_maps_provider_fallback_activated`, `operation=distance_matrix`                                                          |
| Fallback operation                      | `distance_matrix`                                                                                                                     |
| Fallback command result                 | Local in-memory fallback returned demo estimate: 899 m, 2 mins                                                                        |
| Log event ID or search URL              | Local `apps/api/storage/logs/laravel.log` entry at `2026-04-20 12:35:33`; no platform log-drain URL available                         |
| Alert incident ID or URL                | Blocked: staging log-drain monitor unavailable                                                                                        |
| Persistent config verification          | No key persisted; `settings_count=0`, `stored_keys=0`; live Distance Matrix endpoint remains Google                                   |
| Customer/rider provider-failure UX note | Not re-run in staging; local fallback path returned provider `demo`                                                                   |
| Operator                                | Codex automation                                                                                                                      |
| Result                                  | Blocked                                                                                                                               |
| Notes                                   | Need real staging Google Maps key in Ops Configuration plus provider dashboard and log-drain monitor links before full drill can pass |

## Dispatch SLA Alert Evidence

Run [dispatch-sla-alert-drill.md](./dispatch-sla-alert-drill.md) in staging after the log-drain monitor is created.

| Field                                     | Value                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Drill date                                | 2026-04-21T15:25:33+03:00                                                                                                                  |
| Environment                               | GitHub Actions CI with MySQL/Redis services; staging log-drain unavailable from workspace                                                  |
| Monitoring provider                       | Blocked: not recorded                                                                                                                      |
| Alert rule name                           | Blocked: not recorded                                                                                                                      |
| Alert destination                         | Blocked: not recorded                                                                                                                      |
| Rule match fields                         | `event=dispatch_sla_breach_window_exceeded`, `breached_total >= DISPATCH_SLA_ALERT_THRESHOLD`                                              |
| `DISPATCH_PICKUP_SLA_MINUTES`             | `30`                                                                                                                                       |
| `DELIVERY_EXCEPTION_RESPONSE_SLA_MINUTES` | `10`                                                                                                                                       |
| `DISPATCH_SLA_ALERT_THRESHOLD`            | `1`                                                                                                                                        |
| Synthetic pickup order UUID               | CI-generated by `tests/Feature/Ops/DispatchSlaAlertTest.php`; not persisted as staging evidence                                            |
| Synthetic delivery-exception UUID         | CI-generated by `tests/Feature/Ops/DispatchSlaAlertTest.php`; not persisted as staging evidence                                            |
| `ops:dispatch-sla-alerts` result          | Pass in CI feature test: command exits `0` and logs one pickup breach plus one delivery-exception breach                                   |
| Log event ID or search URL                | Blocked: staging log-drain monitor unavailable                                                                                             |
| Alert incident ID or URL                  | Blocked: staging alert destination unavailable                                                                                             |
| Cleanup verification                      | CI database is ephemeral; staging synthetic data cleanup not run                                                                           |
| Operator                                  | Codex automation                                                                                                                           |
| Result                                    | Blocked                                                                                                                                    |
| Notes                                     | CI validates the command, schedule, and warning payload. Full launch pass still requires a real staging log-drain alert and incident link. |

## MySQL Restore Drill Evidence

Run [mysql-backup-restore-drill.md](./mysql-backup-restore-drill.md) in staging or an isolated maintenance VM.

| Field                    | Value                                                                                                                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drill date               | 2026-04-21T15:47:03+03:00                                                                                                                                                                                                                                                                                                             |
| Environment              | Local XAMPP MariaDB 10.4.32 maintenance shell; staging backup host unavailable from workspace                                                                                                                                                                                                                                         |
| Backup disk              | Local Laravel backup disk (`BACKUP_DISKS=local`)                                                                                                                                                                                                                                                                                      |
| Backup archive timestamp | 2026-04-21T15:47:10+03:00                                                                                                                                                                                                                                                                                                             |
| Backup archive size      | 7,342 bytes                                                                                                                                                                                                                                                                                                                           |
| Backup archive checksum  | SHA-256 `C2D747B5070FA7AD6CD215C5F46C42E482C1278D7BCE6D59CF09A222D3F888DC`                                                                                                                                                                                                                                                            |
| Restore database         | `talabix_restore_20260421_154703`, then validation probe `talabix_restore_probe_20260421_154833`                                                                                                                                                                                                                                      |
| Extract result           | Pass: backup zip expanded and SQL dump extracted in local ignored artifact directory `tmp/launch-drills/20260421_154703`                                                                                                                                                                                                              |
| Import result            | Pass: SQL dump imported into disposable restore databases without MySQL client errors                                                                                                                                                                                                                                                 |
| Migration status result  | Pass: `php artisan migrate:status` reported all 22 migrations as `Ran`; schema check found 22 migration rows in restored DB                                                                                                                                                                                                           |
| Readiness test result    | Pass for direct readiness service probe: restored DB reported `status=ready` with database/cache/queue ok and Reverb skipped because local probe used `BROADCAST_CONNECTION=log`. `php artisan test tests/Feature/Ops/ReadinessTest.php` remains blocked locally by PHP 8.2 parsing a PHP 8.3 typed constant in PHPUnit dependencies. |
| Cleanup verification     | Pass: disposable source and restore databases were dropped after the drill                                                                                                                                                                                                                                                            |
| Operator                 | Codex automation                                                                                                                                                                                                                                                                                                                      |
| Result                   | Blocked                                                                                                                                                                                                                                                                                                                               |
| Notes                    | Local restore mechanics passed with an ignored local backup artifact. Full launch pass still requires restoring a real staging backup archive from the staging backup disk on a staging or isolated maintenance host.                                                                                                                 |

## Incident Drill Evidence

Run the incident drill after the staging incident channel/tool, participant roster, and follow-up issue tracker are available.

| Field                           | Value                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Drill date                      | 2026-04-21T15:49:08+03:00                                                                                                                              |
| Environment                     | Local workspace only; staging incident channel/tool unavailable                                                                                        |
| Incident tool or channel        | Blocked: not configured or provided                                                                                                                    |
| Scenario                        | Planned P1 dispatch or maps-provider degradation tabletop                                                                                              |
| Incident lead                   | Blocked: participant roster not provided                                                                                                               |
| Investigator                    | Blocked: participant roster not provided                                                                                                               |
| Communicator                    | Blocked: participant roster not provided                                                                                                               |
| Fix owner                       | Blocked: participant roster not provided                                                                                                               |
| P0/P1 classification            | Not executed                                                                                                                                           |
| First status update timestamp   | Not executed                                                                                                                                           |
| Customer/merchant/rider impact  | Not executed                                                                                                                                           |
| Mitigation or rollback decision | Not executed                                                                                                                                           |
| Smoke-check result after action | Not executed                                                                                                                                           |
| Follow-up issue ID or URL       | Blocked: incident/follow-up issue workflow not provided                                                                                                |
| Participant acknowledgment      | Blocked: participant roster not provided                                                                                                               |
| Result                          | Blocked                                                                                                                                                |
| Notes                           | A real incident drill needs an agreed channel/tool, named responders, and a follow-up issue link. Do not mark this ready from a solo local simulation. |

## Evidence Rules

- Mark `Result` as `Pass`, `Fail`, or `Blocked`.
- A blocked drill must name the missing access, secret, provider setting, or environment dependency.
- Prefer console links and issue IDs over screenshots when the provider keeps audit history.
- Redact order/customer details unless the data is synthetic and safe to keep in git.
- Update the production-readiness launch gaps only after the matching evidence row is completed.
- After the evidence table is complete, run `npm run launch:preflight` with `TALABIX_PREFLIGHT_PHP_VERSION` set to the PHP runtime used for API tests, for example `8.3.2`. Do not promote production traffic while the preflight reports blockers.
