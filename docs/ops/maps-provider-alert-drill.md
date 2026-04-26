# Maps Provider Alert Drill

Use this drill before launch and after any maps-provider, dispatch routing, address search, or checkout serviceability change that can affect place lookup or ETA projection.

## Alert Signals

Talabix has two maps-provider monitoring layers:

1. Provider dashboard alerts for the Google Maps project, covering quota, billing, and API error signals.
2. API log-drain alerts for application fallback behavior when Google Maps fails and Talabix falls back to demo estimates.

The API emits a structured warning when Google Maps fails and demo fallback is enabled:

- Message: `Google Maps provider fallback activated.`
- `event=google_maps_provider_fallback_activated`
- `provider=google_maps`
- `fallback_provider=demo`
- `operation=places_search` or `operation=distance_matrix`

Treat sustained fallback as production-impacting because address search, serviceability filtering, checkout pricing, dispatch ETA projection, and rider navigation can all drift when the live provider is unavailable.

## Provider Dashboard Setup

Create provider-side alerts in the staging and production Google Maps project before launch.

| Alert field          | Minimum value                                                         |
| -------------------- | --------------------------------------------------------------------- |
| APIs covered         | Places API and Distance Matrix API                                    |
| Quota usage          | Warn at 80 percent, page or incident at 95 percent                    |
| Error rate           | Alert on sustained provider 4xx or 5xx spikes over a 10-minute window |
| Billing health       | Alert when billing is disabled, budget is exhausted, or payment fails |
| Notification route   | Ops on-call or the launch incident channel                            |
| Runbook link         | `docs/ops/maps-provider-alert-drill.md`                               |
| Evidence destination | `docs/ops/launch-evidence.md`                                         |

Record the project name, alert destinations, and provider alert links in [launch-evidence.md](./launch-evidence.md).

## Log-Drain Rule Setup

Create a staging log monitor for application fallback events.

| Rule field         | Minimum value                                                      |
| ------------------ | ------------------------------------------------------------------ |
| Name               | `Talabix maps provider fallback`                                   |
| Source             | API logs collected from stderr or the platform log drain           |
| Match              | `event=google_maps_provider_fallback_activated`                    |
| Threshold          | At least one matching warning in a 10-minute staging drill window  |
| Grouping           | Environment, service/process, and `operation` when supported       |
| Primary severity   | P2 for sustained `places_search` fallback                          |
| Escalation         | P1 for sustained `distance_matrix` fallback during active ordering |
| Notification route | Ops on-call or the launch incident channel                         |
| Runbook link       | `docs/ops/maps-provider-alert-drill.md`                            |

In production, tune the threshold to the chosen monitoring provider and order volume. The minimum launch rule should alert on repeated fallback warnings in a 10-minute window, and it should expose `operation` and `error` in the alert payload.

## Staging Drill

Run this in staging or a staging maintenance shell. Do not change production maps endpoints for a drill.

1. Confirm staging has:
   - `MAPS_PROVIDER=google_maps`
   - Google Maps API key configured through ops configuration, with `GOOGLE_MAPS_API_KEY` available only as an environment fallback when needed
   - `GOOGLE_MAPS_FALLBACK_TO_DEMO=true`
   - Places API and Distance Matrix API enabled in the provider project
2. Confirm provider dashboard alerts are active for quota, provider errors, billing health, and budget exhaustion.
3. Run a one-off fallback check without changing persistent environment variables:

   ```bash
   php artisan tinker --execute="config(['services.maps.provider' => 'google_maps', 'services.google_maps.key' => config('services.google_maps.key'), 'services.google_maps.distance_matrix_endpoint' => 'https://maps.invalid.example/maps/api/distancematrix/json', 'services.google_maps.fallback_to_demo' => true]); app(\App\Modules\Shared\Services\MapsProviderService::class)->distanceEstimate(24.716, 46.681, 24.7118, 46.6734);"
   ```

4. Confirm the command exits successfully with a demo fallback estimate.
5. Confirm the platform log drain receives `event=google_maps_provider_fallback_activated` with `operation=distance_matrix`.
6. Confirm the monitoring tool opens one staging alert and includes the fallback `error`.
7. Confirm no persistent staging config was changed and live endpoint values still point to the selected provider.

## Evidence Table

Use the maps provider section in [launch-evidence.md](./launch-evidence.md) as the launch record. At minimum, capture:

- The provider project name and alert destinations.
- The provider alert links for quota, error rate, billing, and budget health.
- The fallback log-monitor rule name.
- The tinker fallback command result.
- The provider log event ID or search URL for `event=google_maps_provider_fallback_activated`.
- The alert incident ID or URL.
- The cleanup/config verification after the one-off drill.

## Escalation Rule

Treat production `distance_matrix` fallback as P1 when active ordering or dispatch is running, because delivery fees, serviceability filtering, ETA projection, and dispatch ranking can become unreliable. Treat isolated `places_search` fallback as P2 unless customers cannot save addresses or checkout conversion drops.
