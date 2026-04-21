# Production Readiness

This runbook defines the first Talabix staging and production operating baseline. It is written for the current repository shape: a Laravel API, Horizon worker, scheduler, Reverb websocket service, React portal, Expo customer app, and Expo rider app.

## Environment Model

Talabix should run three isolated environments before public launch:

| Environment | Purpose                                     | Data                           | Release rule                               |
| ----------- | ------------------------------------------- | ------------------------------ | ------------------------------------------ |
| Local       | Developer validation                        | Seed/demo data only            | Any branch                                 |
| Staging     | Production rehearsal and acceptance testing | Sanitized production-like data | Main branch, after CI passes               |
| Production  | Customer, merchant, rider, and ops traffic  | Live data                      | Tagged release or approved main deployment |

Staging and production must not share databases, Redis instances, object buckets, mail/SMS credentials, Reverb credentials, or map provider keys.

## Deployment Target

The selected first deployment target is a single Linux VM per environment running Docker Compose behind an external TLS reverse proxy or load balancer. The target is intentionally conservative because it matches the current Laravel/Docker architecture and can be split later into managed MySQL, Redis, object storage, and separately scaled workers.

The deployment assets live under `deploy/`:

- `deploy/docker-compose.vm.yml` adds VM restart policies, API health checks, and the portal container.
- `deploy/portal.Dockerfile` builds the React portal into an Nginx container.
- `deploy/README.md` documents VM preparation and required GitHub Environment secrets.
- `.github/workflows/deploy.yml` verifies the API and JS workspaces, syncs the repo over SSH, applies encoded env files, runs migrations, restarts services, and checks `/api/v1/readiness`.

## Required Services

The production deployment must run these processes independently so they can be scaled and restarted without taking down the whole platform.

| Process                 | Command or role                                                   | Required for                                        |
| ----------------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| API web                 | `php artisan serve` locally; production web runtime behind TLS    | REST API and Scribe docs                            |
| Worker                  | `php artisan horizon`                                             | notifications, retries, async jobs                  |
| Scheduler               | `php artisan schedule:work` or the bundled scheduler start script | recurring maintenance tasks                         |
| Reverb                  | `php artisan reverb:start`                                        | realtime order, dispatch, and notification channels |
| Portal build            | `npm --workspace @talabix/portal-web run build`                   | merchant and ops portal                             |
| MySQL                   | Managed MySQL 8.4-compatible service preferred                    | source of truth                                     |
| Redis                   | Managed Redis 7-compatible service preferred                      | cache, queue, Horizon, broadcasts                   |
| Mail/SMS/push providers | Provider-specific credentials                                     | transactional notification delivery                 |
| Object storage          | S3-compatible bucket when uploads become production data          | future media and documents                          |

## Secret And Configuration Checklist

Set these values per environment and store them in the deployment platform secret manager, not in git.

| Area            | Required values                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Laravel runtime | `APP_ENV`, `APP_KEY`, `APP_DEBUG=false`, `APP_URL`, `APP_LOCALE`, `APP_FALLBACK_LOCALE`                                                  |
| Database        | `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, optional TLS settings                                                 |
| Redis           | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`                                              |
| Reverb          | `BROADCAST_CONNECTION=reverb`, `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`, public host/port/scheme                           |
| Notifications   | mailer credentials, SMS provider credentials, push provider credentials, retry/backoff settings                                          |
| Maps            | `MAPS_PROVIDER=google_maps`, optional `GOOGLE_MAPS_API_KEY` env fallback, admin-managed Google Maps key, average speed fallback settings |
| Security        | `SESSION_DOMAIN`, CORS/domain policy, `SCRIBE_AUTH_KEY`, `READINESS_CHECK_KEY`, `SENTRY_LARAVEL_DSN`, log drain tokens                   |
| Storage         | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_BUCKET`, optional endpoint                                      |
| Backups         | `BACKUP_DISKS`, `BACKUP_NOTIFICATION_EMAIL`, `BACKUP_ARCHIVE_PASSWORD`, backup retention and health-check thresholds                     |

Production must use `LOG_CHANNEL=stack`, `LOG_STACK=stderr`, and `LOG_LEVEL=info` or stricter so platform log drains can collect structured process logs.

## Release Checklist

Run this sequence for every staging deployment. Use the same sequence for production after staging passes.

1. Confirm CI passed for API, shared package, portal, customer app, and rider app.
2. Confirm no pending emergency freeze or open incident affects deployment.
3. Build application artifacts:
   - API container or server bundle.
   - Portal static build.
   - Mobile releases through the selected Expo/EAS channel when mobile changes are included.
4. Apply environment variables from the target secret manager.
5. Put the API into maintenance mode only when a migration is not backward-compatible.
6. Run database migrations with `php artisan migrate --force`.
7. Restart API web, worker, scheduler, and Reverb processes.
8. Run smoke checks:
   - `GET /up` returns success.
   - `GET /api/v1/readiness` returns `ready` with the configured readiness key.
   - Customer login or registration path responds.
   - Merchant order board loads.
   - Rider availability endpoint responds.
   - Ops dashboard endpoint responds.
   - Horizon shows active workers with no failed job spike.
   - Reverb websocket accepts a connection.
9. Exit maintenance mode if it was enabled.
10. Fill or update [launch-evidence.md](./launch-evidence.md), then run `npm run launch:preflight` with `TALABIX_PREFLIGHT_PHP_VERSION` set to the PHP runtime used for API verification.
11. Watch logs, queue depth, notification failures, and API error rates for at least 30 minutes.

## Monitoring Baseline

Production monitoring should cover these signals before launch.

| Signal                | Alert condition                                           | Why it matters                                                 |
| --------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| API uptime            | `/up` fails from two regions for 2 minutes                | Confirms the web process and routing are alive                 |
| API error rate        | 5xx rate exceeds 1 percent for 5 minutes                  | Catches regressions and provider failures                      |
| Queue depth           | Default or notification queue grows for 10 minutes        | Shows workers are lagging or failing                           |
| Failed jobs           | New failed jobs appear after deployment                   | Surfaces notification, dispatch, and async regressions         |
| Horizon workers       | Worker count below expected value for 2 minutes           | Protects async delivery                                        |
| Scheduler heartbeat   | No scheduled-task heartbeat for 10 minutes                | Protects maintenance and future recurring jobs                 |
| Reverb health         | Connection failures exceed threshold                      | Protects realtime boards and app updates                       |
| Database              | CPU, connections, disk, replication lag exceed thresholds | Protects core transactional flows                              |
| Redis                 | Memory, evictions, connection failures exceed thresholds  | Protects cache, queues, and broadcasts                         |
| Notification delivery | Failure or retry rate exceeds threshold by channel        | Protects customer/rider/merchant communication                 |
| Maps provider         | Provider quota/error alerts fire or fallback logs spike   | Protects discovery, ETA, checkout pricing, and dispatch flows  |
| Dispatch SLA windows  | `dispatch_sla_breach_window_exceeded` appears in logs     | Protects pickup assignment and delivery-exception ops response |

Until a dedicated observability stack is selected, use platform logs plus provider dashboards as the minimum source of truth. The preferred launch setup is a log drain, uptime monitor, error tracker, and database/Redis provider metrics dashboard.

The maps provider emits `event=google_maps_provider_fallback_activated` when Google Maps calls fail and demo fallback is used. Use [maps-provider-alert-drill.md](./maps-provider-alert-drill.md) to configure provider dashboard alerts for Places API, Distance Matrix API, quota, billing, and fallback log-drain monitoring.

The Laravel scheduler emits the initial dispatch SLA alert signal every five minutes through `php artisan ops:dispatch-sla-alerts`. The log-drain rule should match `event=dispatch_sla_breach_window_exceeded` and open an alert when `breached_total` meets `DISPATCH_SLA_ALERT_THRESHOLD`.

Use [launch-evidence.md](./launch-evidence.md) to record the monitoring provider, alert destination, drill output, provider log event ID, and alert incident ID. A monitoring rule is not launch-ready until the staging drill produces an alert, the synthetic data cleanup or persistent config verification is captured, and `npm run launch:preflight` no longer reports evidence blockers.

## Backup Policy

MySQL backups are mandatory before production traffic.

| Backup type                 | Frequency                            | Retention                      | Notes                                     |
| --------------------------- | ------------------------------------ | ------------------------------ | ----------------------------------------- |
| Automated snapshot          | At least daily                       | 14 daily, 8 weekly, 12 monthly | Managed database snapshots preferred      |
| Point-in-time recovery      | Continuous when provider supports it | 7 to 14 days                   | Required before high-volume launch        |
| Manual pre-release snapshot | Before risky migrations              | Until release is accepted      | Attach release tag and migration hash     |
| Object storage backup       | Daily once uploads are live          | Match legal retention policy   | Include catalog media and rider documents |

Run a restore drill before launch and then at least once per quarter. A backup that has not been restored successfully is not considered verified.

The Laravel scheduler runs the initial MySQL backup automation daily: cleanup at 01:00, DB-only backup at 01:30, and backup health monitoring at 10:00. Archive verification must stay enabled with `BACKUP_VERIFY_ARCHIVE=true`, and `BACKUP_DISKS` should point at the production backup destination, such as `s3`, after object storage credentials are available.

Use [mysql-backup-restore-drill.md](./mysql-backup-restore-drill.md) for the staging restore procedure and [launch-evidence.md](./launch-evidence.md) for the evidence table.

## Rollback Runbook

Use rollback when a production release causes customer, merchant, rider, ops, payment, dispatch, or notification harm that cannot be mitigated with a config change.

1. Declare the rollback owner in the incident channel.
2. Stop non-critical deployments until the rollback is complete.
3. Identify whether the issue is application-only, migration-related, provider-related, or data-related.
4. If application-only:
   - Redeploy the previous known-good API and portal artifacts.
   - Restart API web, worker, scheduler, and Reverb processes.
   - Keep the database unchanged.
5. If migration-related:
   - Prefer a forward fix when live data may already depend on the new schema.
   - Use restore only when data corruption or destructive schema changes require it.
6. If provider-related:
   - Switch to configured fallback providers or disable the affected integration.
7. Run the smoke checks from the release checklist.
8. Record the rollback cause, timeline, affected users, and follow-up owner.

Avoid `php artisan migrate:rollback` in production unless the migration was explicitly designed and rehearsed as reversible with live data.

## Incident Runbook

Use this first-response flow for production incidents.

1. Assign roles:
   - Incident lead owns decisions and status.
   - Investigator owns logs, metrics, traces, and reproduction.
   - Communicator owns stakeholder updates.
   - Fix owner owns mitigation and code/config changes.
2. Classify impact:
   - P0: ordering, payment collection, dispatch, or login broadly unavailable.
   - P1: one actor group or one critical workflow degraded.
   - P2: limited workflow issue with workaround.
   - P3: cosmetic, reporting, or low-risk issue.
3. Stabilize:
   - Pause deployment.
   - Disable or roll back the suspected change if clear.
   - Scale workers or web processes if queue or request load is the issue.
   - Switch provider fallback for maps, mail, SMS, or push when provider failure is isolated.
4. Diagnose:
   - Check API logs and 5xx rate.
   - Check Horizon failed jobs and queue depth.
   - Check database and Redis health.
   - Check Reverb connections for realtime incidents.
   - Check notification provider delivery dashboards.
5. Communicate every 15 minutes for P0/P1 until stabilized.
6. Close only after the metric is recovered, smoke checks pass, and a follow-up issue exists.
7. Write a short post-incident note with root cause, trigger, detection gap, and prevention work.

## Launch Gaps

These items remain open after this runbook and should be handled as concrete follow-up slices.

1. Select monitoring tools and wire alerts for the baseline signals above, then record the provider and destination links in [launch-evidence.md](./launch-evidence.md).
2. Run the first staging MySQL restore drill and attach evidence in [launch-evidence.md](./launch-evidence.md).
3. Add staging and production Google Maps keys through ops configuration, then complete provider dashboard alerts and a staging fallback alert drill.
4. Connect the dispatch SLA log signal to the selected monitoring tool, run [dispatch-sla-alert-drill.md](./dispatch-sla-alert-drill.md) in staging, and attach evidence in [launch-evidence.md](./launch-evidence.md).
5. Run `npm run launch:preflight` after the evidence rows are updated and resolve any remaining blockers before production traffic.
