# Launch Evidence Record

This record is the source of truth for pre-launch operational proof. Keep raw secrets, passwords, access keys, private DSNs, customer data, and full database dumps out of this file. Link to restricted console screenshots or incident-tool records when evidence cannot be safely copied into git.

## Required Before Production Traffic

| Area                  | Required evidence                                           | Status  | Owner | Evidence link or note                                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------- | ------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Staging deployment    | Successful staging deploy, migrations, and smoke checks     | Blocked | Ops   | Latest branch CI passed: https://github.com/abdelkarimhamd/Talabix/actions/runs/24722098497. Blocked: staging VM/domain/secrets and deployment target access are not available in this workspace                      |
| Baseline monitoring   | Uptime, error-rate, queue, failed-job, scheduler, DB, Redis | Blocked | Ops   | CI guardrails passed for lint, tests, PHPStan, Pint, and API migrations/tests. Blocked: monitoring provider, log drain, uptime/error/queue dashboard links, and alert destination are not available in this workspace |
| Maps provider alerts  | Provider dashboard alerts and fallback log-drain drill      | Blocked | Ops   | Blocked: staging key, provider dashboard links, and log-drain monitor links are not available in this workspace                                                                                                       |
| Dispatch SLA alerting | Log-drain monitor and successful alert drill                | Blocked | Ops   | Blocked: staging log-drain monitor, alert destination, and synthetic staging order access are not available in this workspace                                                                                         |
| MySQL restore drill   | Backup archive restored into a disposable database          | Blocked | Ops   | Blocked: staging backup disk, backup archive, disposable restore database, and maintenance host access are not available in this workspace                                                                            |
| Incident drill        | P0/P1 response walkthrough with roles and follow-up issue   | Blocked | Ops   | Blocked: staging incident channel/tool, participant roster, and follow-up issue tracker links are not available in this workspace                                                                                     |

## Latest CI Gate Evidence

| Field                  | Value                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Gate date              | 2026-04-21T15:25:33+03:00                                                                                          |
| Branch                 | `codex/design`                                                                                                     |
| Commit                 | `157f76f`                                                                                                          |
| GitHub Actions run     | https://github.com/abdelkarimhamd/Talabix/actions/runs/24722098497                                                 |
| API job result         | Pass: Composer install, env/key setup, MySQL migrations/seeds, Pint, PHPStan, and `php artisan test` on PHP 8.3    |
| Clients job result     | Pass: npm install, Playwright browser setup, lint, i18n audit, workspace tests, customer e2e, and artifact uploads |
| PHPStan baseline guard | Pass: `apps/api/phpstan-baseline.neon` absent; CI guard is active                                                  |
| Staging deployment     | Not run from this workspace                                                                                        |
| Result                 | Pass for CI gate; staging environment evidence still Blocked                                                       |

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

| Field                    | Value                                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Drill date               | 2026-04-21T15:25:33+03:00                                                                                                              |
| Environment              | GitHub Actions CI with MySQL service; disposable staging restore host unavailable from workspace                                       |
| Backup disk              | Configured in CI through `BACKUP_DISKS` defaults; production/staging disk not recorded                                                 |
| Backup archive timestamp | Blocked: no staging backup archive available                                                                                           |
| Backup archive size      | Blocked: no staging backup archive available                                                                                           |
| Backup archive checksum  | Blocked: no staging backup archive available                                                                                           |
| Restore database         | Blocked: disposable staging restore database unavailable                                                                               |
| Extract result           | Blocked: no staging backup archive available                                                                                           |
| Import result            | Blocked: disposable staging restore database unavailable                                                                               |
| Migration status result  | CI migrations and seeds passed in https://github.com/abdelkarimhamd/Talabix/actions/runs/24722098497                                   |
| Readiness test result    | API test suite passed in CI; restore-specific readiness test against a disposable restored database was not run                        |
| Cleanup verification     | CI database is ephemeral; staging restore database cleanup not run                                                                     |
| Operator                 | Codex automation                                                                                                                       |
| Result                   | Blocked                                                                                                                                |
| Notes                    | CI validates backup schedule/config tests. Full launch pass still requires restoring a real backup archive into a disposable database. |

## Incident Drill Evidence

Run the incident drill after the staging incident channel/tool, participant roster, and follow-up issue tracker are available.

| Field                           | Value |
| ------------------------------- | ----- |
| Drill date                      |       |
| Environment                     |       |
| Incident tool or channel        |       |
| Scenario                        |       |
| Incident lead                   |       |
| Investigator                    |       |
| Communicator                    |       |
| Fix owner                       |       |
| P0/P1 classification            |       |
| First status update timestamp   |       |
| Customer/merchant/rider impact  |       |
| Mitigation or rollback decision |       |
| Smoke-check result after action |       |
| Follow-up issue ID or URL       |       |
| Participant acknowledgment      |       |
| Result                          |       |
| Notes                           |       |

## Evidence Rules

- Mark `Result` as `Pass`, `Fail`, or `Blocked`.
- A blocked drill must name the missing access, secret, provider setting, or environment dependency.
- Prefer console links and issue IDs over screenshots when the provider keeps audit history.
- Redact order/customer details unless the data is synthetic and safe to keep in git.
- Update the production-readiness launch gaps only after the matching evidence row is completed.
- After the evidence table is complete, run `npm run launch:preflight` with `TALABIX_PREFLIGHT_PHP_VERSION` set to the PHP runtime used for API tests, for example `8.3.2`. Do not promote production traffic while the preflight reports blockers.
