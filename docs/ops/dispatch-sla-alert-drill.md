# Dispatch SLA Alert Drill

Use this drill before launch and after any dispatch, queue, or monitoring change that can affect rider assignment or delivery-exception response timing.

## Alert Signal

The scheduler runs `php artisan ops:dispatch-sla-alerts` every five minutes.

The command writes a structured warning log when the total breached pickup assignments and unresolved breached delivery exceptions meets `DISPATCH_SLA_ALERT_THRESHOLD`.

Log-drain alert match:

- `event=dispatch_sla_breach_window_exceeded`
- `breached_total >= DISPATCH_SLA_ALERT_THRESHOLD`

The warning includes:

- `breached_pickup_assignments`
- `breached_delivery_exceptions`
- `oldest_pickup_assignment_minutes`
- `oldest_delivery_exception_minutes`
- `sample_order_uuids`

## Monitoring Rule Setup

Create the staging log monitor before running the drill.

| Rule field          | Minimum value                                                       |
| ------------------- | ------------------------------------------------------------------- |
| Name                | `Talabix dispatch SLA breach window`                                |
| Source              | API scheduler logs collected from stderr or the platform log drain  |
| Match               | `event=dispatch_sla_breach_window_exceeded`                         |
| Threshold           | At least one matching warning in a 10-minute window                 |
| Grouping            | Environment and service/process when the provider supports grouping |
| Primary severity    | P2 when only `breached_pickup_assignments` is non-zero              |
| Escalation severity | P1 when `breached_delivery_exceptions` is non-zero                  |
| Notification route  | Ops on-call or the launch incident channel                          |
| Runbook link        | `docs/ops/dispatch-sla-alert-drill.md`                              |

If the monitoring provider supports numeric field filters, add `breached_total >= DISPATCH_SLA_ALERT_THRESHOLD` to avoid alerting on healthy command output. If it only supports text search, alert on the warning message because healthy snapshots use `Dispatch SLA breach window healthy.` instead.

Record the configured rule name, destination, log event ID, and alert incident link in [launch-evidence.md](./launch-evidence.md).

## Staging Drill

1. Confirm staging uses production-like values for:
   - `DISPATCH_PICKUP_SLA_MINUTES`
   - `DELIVERY_EXCEPTION_RESPONSE_SLA_MINUTES`
   - `DISPATCH_SLA_ALERT_THRESHOLD`
2. Create or seed one active assignment older than the pickup SLA.
3. Create or seed one `exception_reported` delivery assignment with a `delivery_exception_reported` timeline event older than the delivery-exception response SLA.
4. Run:

   ```bash
   php artisan ops:dispatch-sla-alerts
   ```

5. Confirm the command exits successfully and prints a JSON snapshot.
6. Confirm the platform log drain receives `Dispatch SLA breach window exceeded.` with `event=dispatch_sla_breach_window_exceeded`.
7. Confirm the monitoring tool opens one alert with the sample order UUIDs.
8. Reassign the breached order or move the synthetic data back under the SLA window.
9. Run the command again and confirm the next snapshot does not emit a warning.

## Evidence Table

Use the dispatch SLA section in [launch-evidence.md](./launch-evidence.md) as the launch record. At minimum, capture:

- The monitor rule name and alert destination.
- The synthetic order UUIDs used for the pickup and delivery-exception breach.
- The JSON snapshot printed by `php artisan ops:dispatch-sla-alerts`.
- The provider log event ID or search URL for `event=dispatch_sla_breach_window_exceeded`.
- The alert incident ID or URL.
- The cleanup verification after the synthetic data is moved back under the SLA window.

## Escalation Rule

Treat a production alert as P1 when breached delivery exceptions are non-zero, because the customer handoff is already blocked. Treat pickup-only alerts as P2 unless order volume, region concentration, or queue depth shows broader dispatch degradation.
