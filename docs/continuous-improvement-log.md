# Talabix Continuous Improvement Log

## 2026-04-21 - Portal support label hardening

### Issues Found

- Merchant order, merchant inbox, and ops support console views still used local string replacement for backend enum values, which exposed lower-case or raw-ish labels such as `order status updated`, `push`, `failed`, and support reason wire values.
- Shared i18n enum coverage was missing support issue types, support resolution types, support cancellation reasons, notification channels, merchant notification actors, and the maps configuration audit action.
- Customer app tests had drifted behind the redesigned home/offers/profile surfaces, causing false failures from duplicated visible text and stale Arabic expectations.
- Workspace-wide lint surfaced a customer order history import/state mismatch while the broader worktree already contained unrelated daily-run changes.

### Fixes Implemented

- Replaced merchant notification type formatting with shared `labelForEnum` labels and locale-aware date formatting.
- Replaced merchant order board status/timeline humanizers with shared order status, timeline event, and actor labels.
- Replaced ops support console status, issue, resolution, cancellation reason, notification channel, recipient actor, and delivery status display with shared enum labels while preserving wire values for API payloads.
- Added the missing shared English/Arabic enum labels and regression coverage for support and notification enum groups.
- Updated customer app tests to assert redesigned duplicated content safely and to source Arabic expectations from the shared translation helper.

### Enhancements Implemented

- Reused shared support contract arrays for ops support select options instead of duplicating option literals in the component.
- Strengthened portal regression coverage for merchant notification labels and support notification delivery labels.
- Restored clean workspace-wide ESLint validation after the customer-app lint blocker was identified.

### Files Changed

- `apps/portal-web/src/features/merchant/MerchantNotificationsBoard.jsx`
- `apps/portal-web/src/features/merchant/MerchantOrderBoard.jsx`
- `apps/portal-web/src/features/ops/SupportConsole.jsx`
- `apps/portal-web/src/App.test.jsx`
- `packages/shared/src/i18n/index.js`
- `packages/shared/src/i18n/i18n.test.js`
- `apps/customer-app/__tests__/customer-app.test.js`
- `apps/customer-app/src/screens/CustomerOrdersScreen.js`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- `node packages\shared\src\i18n\i18n.test.js` - passed, 4 tests.
- `npm.cmd --workspace @talabix/customer-app run test` - passed, 36 tests.
- `npm.cmd --workspace @talabix/portal-web run lint -- --max-warnings=0` - passed.
- `npm.cmd run lint -- --max-warnings=0` - passed with no warnings.
- `npm.cmd --workspace @talabix/portal-web run test -- --run` - blocked before test execution by local `esbuild` process spawn `EPERM`.

### Risks And Follow-Up Items

- Portal Vitest remains unverified on this workstation until the existing `spawn EPERM` policy is resolved or CI runs the suite.
- `apps/portal-web/src/features/ops/SettlementBoard.jsx` still has a local `entry_type.replaceAll('_', ' ')` label and should be migrated to shared enum labels next.
- Some customer-app static home/offers copy remains English inside Arabic sessions; continue localization incrementally.

### Recommended Next Priorities

- Resolve the portal Vitest `esbuild` spawn blocker or validate the portal suite in CI.
- Migrate settlement ledger entry labels and remaining portal static option copy to shared i18n.
- Continue hardening customer mobile tests around redesigned duplicated surfaces with role/testID-based assertions.

## 2026-04-21 - Launch workbench access checklist

### Issues Found

- The launch workbench correctly identified external access blockers, but operators still had to scan each blocked row to assemble one Ops handoff list.
- The README described launch preflight, but did not name the workbench checklist as the first command to run when evidence is blocked.

### Fixes Implemented

- Added an `externalAccessChecklist` to launch workbench evaluation and formatted output.
- Grouped external blockers by launch area and owner so Ops can see the staging, monitoring, maps, dispatch SLA, backup, and incident-tool access requests in one section.
- Normalized blocked evidence notes into actionable `provide ...` checklist items without carrying raw availability phrasing into the request line.
- Updated the README launch note to point operators to `npm run launch:workbench` before `launch:preflight` when evidence is still blocked.

### Validation Completed

- `node scripts\launch-workbench.test.mjs` passed, 7 tests.
- `node scripts\launch-preflight.test.mjs` passed, 6 tests.
- `npm.cmd run test:shared` passed, 20 tests.
- `npm.cmd run launch:workbench --silent` reported the expected blocked state with a clean external access checklist.
- `npx.cmd prettier --check README.md docs/continuous-improvement-log.md scripts/launch-workbench.mjs scripts/launch-workbench.test.mjs` passed.
- `git diff --check -- README.md scripts/launch-workbench.mjs scripts/launch-workbench.test.mjs` passed; Git still emitted the existing LF-to-CRLF warning for README.

### Risks And Follow-Up Items

- This is an operator handoff improvement only; it does not complete the staging deploy, monitoring setup, maps provider alert drill, dispatch SLA drill, MySQL restore drill, or incident walkthrough.
- After Ops provides the listed access and links, update `docs/ops/launch-evidence.md` and run `launch:preflight` with the verified PHP 8.3 runtime value.

## 2026-04-21 - Launch workbench operator guidance

### Issues Found

- The launch workbench suggested POSIX inline environment-variable syntax for `launch:preflight`, which fails in this PowerShell workspace.
- External-access rows in the workbench output repeated one generic next action even though `docs/ops/launch-evidence.md` already names each concrete missing dependency.

### Fixes Implemented

- Updated `scripts/launch-workbench.mjs` so blocked external-access rows surface their specific evidence note as the next action.
- Added PowerShell and POSIX `launch:preflight` command hints when the PHP runtime warning is present.
- Updated the README launch preflight note with both shell forms.

### Validation Completed

- `node scripts\launch-workbench.test.mjs` passed, 6 tests.
- `node scripts\launch-preflight.test.mjs` passed, 6 tests.
- `npm.cmd run test:shared` passed, 19 tests.
- `npm.cmd run launch:workbench --silent` reported the expected blocked state with specific external blockers and shell-specific preflight commands.
- `$env:TALABIX_PREFLIGHT_PHP_VERSION='8.3.30'; npm.cmd run launch:preflight` remained blocked as expected because no production-traffic evidence row is ready yet.
- `npx.cmd prettier --check README.md docs/continuous-improvement-log.md scripts/launch-workbench.mjs scripts/launch-workbench.test.mjs` passed.
- `git diff --check -- README.md docs/continuous-improvement-log.md scripts/launch-workbench.mjs scripts/launch-workbench.test.mjs` passed; Git still emitted existing LF-to-CRLF warnings for README and the continuous improvement log.

### Risks And Follow-Up Items

- This is operator tooling only; it does not replace the staging deploy, monitoring setup, provider dashboard alerts, restore drill, dispatch SLA drill, or incident walkthrough.
- The next launch step still requires staging credentials/provider access and real drill evidence before any row can move to `Ready`.

## 2026-04-20 - Launch evidence blocker triage

### Issues Found

- The launch workbench still classified several launch evidence rows as local evidence gaps because the required table left their concrete missing dependencies blank.
- The incident drill was listed as a production-traffic blocker, but the evidence file did not yet provide a structured place to capture the walkthrough result.

### Fixes Implemented

- Converted the staging deployment, baseline monitoring, dispatch SLA alerting, MySQL restore drill, and incident drill rows from vague `Pending` states to explicit `Blocked` states with the missing staging, monitoring, backup, and incident-tool dependencies named.
- Assigned the blocked rows to Ops so the evidence owner is clear before staging credentials and provider access are introduced.
- Added an incident drill evidence table for roles, impact classification, mitigation/rollback decisions, communications timing, smoke-check result, and follow-up issue tracking.

### Validation Completed

- `npm.cmd run launch:workbench` reported the launch workbench as blocked and classified the evidence rows as external-access blockers instead of anonymous local gaps.
- `TALABIX_PREFLIGHT_PHP_VERSION=8.3.30 npm.cmd run launch:preflight` remained blocked as expected because no production-traffic evidence row is ready yet.
- `npx.cmd prettier --check docs/ops/launch-evidence.md docs/continuous-improvement-log.md` passed.
- `git diff --check -- docs/ops/launch-evidence.md docs/continuous-improvement-log.md` passed; Git still emitted its existing LF-to-CRLF warning for the continuous improvement log.

### Risks And Follow-Up Items

- This was an evidence hygiene pass; it does not replace the real staging deployment, monitoring setup, restore drill, maps provider alert drill, dispatch SLA drill, or incident walkthrough.
- The next launch step still requires staging credentials/provider access and real drill evidence before any row can move to `Ready`.

## 2026-04-20 - Local launch readiness workbench

### Issues Found

- Launch preflight correctly blocked production promotion, but it did not give operators a local workbench view that separates repo-local evidence gaps from external staging access blockers.
- Maps provider drill evidence could be marked blocked locally, but operators still had to inspect the evidence file by hand to understand which blockers were local versus external.

### Fixes Implemented

- Added `scripts/launch-workbench.mjs` and `npm run launch:workbench`.
- Classified launch evidence rows as `Ready`, `Pending`, or `Blocked`.
- Categorized non-ready rows as `local-evidence`, `external-access`, or `unknown`.
- Added safe output redaction for Google Maps keys and credential-bearing DSNs.
- Wired workbench coverage into `npm run test:shared`.

### Validation Completed

- Red phase: `node scripts/launch-workbench.test.mjs` failed before `scripts/launch-workbench.mjs` existed.
- Green phase: `node scripts/launch-workbench.test.mjs` passed.
- `npm run test:shared` passed.
- `npm run launch:workbench` reported the current local launch state as blocked with pending local evidence and external maps-provider access blockers.
- `TALABIX_PREFLIGHT_PHP_VERSION=8.3.30 npm run launch:preflight` remained blocked as expected because launch evidence rows are not all ready.

### Risks And Follow-Up Items

- The workbench is a local reporting tool; it does not replace real staging provider dashboard, log-drain, restore, or incident drills.
- The next local slice should fill more evidence rows with safe local proof before live/staging access is introduced.

## 2026-04-20 - Launch preflight evidence gate

### Issues Found

- The launch runbooks now describe the required maps, dispatch SLA, and MySQL restore drills, but there was no single repo command that summarized whether the evidence record was still blocking production promotion.
- The remaining launch gaps depend on staging secrets, monitoring access, and backup-host access, so local automation needed a safe way to keep those blockers explicit instead of implying the drills were complete.
- API verification still depends on a PHP `>=8.3` runtime, but local process spawning is constrained enough that a Node-based preflight should not shell out to `php -v`.

### Fixes Implemented

- Added `scripts/launch-preflight.mjs`, a filesystem-only preflight that parses `docs/ops/launch-evidence.md`, verifies required runbooks exist, and enforces the API PHP runtime gate from `apps/api/composer.json` when `TALABIX_PREFLIGHT_PHP_VERSION` is supplied.
- Added `npm run launch:preflight` as the operator-facing command.
- Added unit coverage for launch evidence parsing, pending-evidence blockers, missing or unsupported PHP version blocking, ready-state reporting, and raw PHP version parsing.
- Wired the new test into the existing single-process shared test runner to avoid the local `node --test` child-process restriction.

### Enhancements Implemented

- Updated the README, production readiness runbook, launch evidence record, and engineering alignment backlog so production promotion includes the preflight after staging evidence rows are filled.
- Kept the preflight intentionally evidence-focused: it reports pending or missing launch proof, but it does not replace the actual staging provider, restore, or SLA alert drills.

### Files Changed

- `README.md`
- `package.json`
- `scripts/launch-preflight.mjs`
- `scripts/launch-preflight.test.mjs`
- `scripts/run-shared-tests.mjs`
- `docs/ops/launch-evidence.md`
- `docs/ops/production-readiness.md`
- `docs/talabix-engineering-pack-alignment.md`
- `docs/continuous-improvement-log.md`

### Validation Completed

- Red phase: `node scripts/launch-preflight.test.mjs` failed because `scripts/launch-preflight.mjs` did not exist yet.
- Green phase: `node scripts/launch-preflight.test.mjs` passed, 6 tests.
- `npm.cmd run test:shared` passed, 13 tests.

### Risks And Follow-Up Items

- `npm run launch:preflight` currently reports expected blockers because the staging deployment, monitoring, maps provider, dispatch SLA, MySQL restore, and incident evidence rows remain `Pending`.
- The command relies on `TALABIX_PREFLIGHT_PHP_VERSION` for the runtime check because this workstation blocks Node child-process spawning.
- The actual staging drills still require monitoring credentials, Google Maps provider access, backup storage, and a maintenance database target.

## 2026-04-20 - Admin-managed Google Maps readiness

### Issues Found

- Google Maps was selected as the launch maps provider, but the API only read credentials from environment config.
- Ops users had no admin surface to add or rotate the Google Maps API key later without exposing it back to the portal.
- The shared API contract did not describe masked maps-provider readiness state for the portal.

### Fixes Implemented

- Added encrypted `maps_provider_settings` storage and an ops-only maps provider configuration API.
- Updated `MapsProviderService` to prefer the admin-stored Google Maps key and provider settings before falling back to environment config.
- Added shared validation/client contracts and an ops portal panel for Google Maps provider, region, location bias, timeout, fallback, and key rotation.
- Kept API keys write-only in UI/API responses by returning only configured state, source, and a masked preview.

### Files Changed

- `apps/api/app/Models/MapsProviderSetting.php`
- `apps/api/app/Modules/Shared/Controllers/MapsProviderConfigurationController.php`
- `apps/api/app/Modules/Shared/Requests/UpdateMapsProviderConfigurationRequest.php`
- `apps/api/app/Modules/Shared/Services/MapsProviderConfigurationService.php`
- `apps/api/app/Modules/Shared/Services/MapsProviderService.php`
- `apps/api/database/migrations/2026_04_20_000100_create_maps_provider_settings_table.php`
- `apps/api/routes/api/ops.php`
- `apps/portal-web/src/features/ops/OpsConfigurationBoard.jsx`
- `apps/portal-web/src/portal-api.js`
- `packages/shared/src/api/client.js`
- `packages/shared/src/validation/schemas.js`

### Validation Completed

- Red phase: shared schema and portal Google Maps credential tests failed before implementation.
- `node scripts/run-shared-tests.mjs` passed.
- `npm.cmd --workspace @talabix/portal-web run test -- --run src/App.test.jsx` passed, 21 tests.
- `php -l` passed for all new and changed PHP maps-provider files.
- `npx.cmd prettier --check packages/shared/src/validation/schemas.js packages/shared/src/api/client.js packages/shared/src/contracts/enums.js apps/portal-web/src/features/ops/OpsConfigurationBoard.jsx apps/portal-web/src/portal-api.js apps/portal-web/src/App.test.jsx` passed.
- `git diff --check` passed.

### Risks And Follow-Up Items

- Laravel feature/unit tests are still blocked locally because Composer requires PHP `>=8.3.0` and this workstation is running PHP `8.2.12`.
- Run the new migration and API tests in a PHP 8.3+ environment before staging.
- Add the staging Google Maps key through the ops configuration panel, then run the maps provider alert drill.

## 2026-04-20 - Customer notification feedback test stability

### Issues Found

- Customer notification mark-read tests emitted React `act(...)` warnings from `CustomerNotificationsScreen` after successful mutations.
- The warning came from a local `setFeedback` call inside the TanStack Query mutation `onSuccess` callback, even though the cache updates were already routed through the test harness scheduler.
- The worktree already contained broad uncommitted launch-readiness, dispatch, GPS address, notification, and delivery-exception changes from prior runs; this run preserved those changes and only touched the customer notification stability slice.

### Fixes Implemented

- Replaced customer notification feedback local state with feedback derived from the mutation result/error state.
- Kept the existing cache reconciliation behavior for unread-only and unfiltered notification lists.
- Added a regression test that fails when the customer notification mark-read flow emits React `act(...)` warnings.

### Enhancements Implemented

- Made the customer notification test suite pristine for this flow by removing warning noise that could hide future regressions.
- Preserved the existing user-facing success and error feedback copy while reducing one extra component state update.

### Files Changed

- `apps/customer-app/src/screens/CustomerNotificationsScreen.js`
- `apps/customer-app/__tests__/customer-app.test.js`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- Red phase: `npm.cmd --workspace @talabix/customer-app run test -- --runTestsByPath __tests__/customer-app.test.js --testNamePattern "without React act warnings"` failed because one `CustomerNotificationsScreen` `act(...)` warning was emitted.
- Green phase: the same targeted regression passed after deriving notification feedback from mutation state.
- `npm.cmd --workspace @talabix/customer-app run test -- --runTestsByPath __tests__/customer-app.test.js --testNamePattern "customer notification"` passed, 4 tests.
- `npm.cmd run test:customer` passed, 35 tests.
- `npm.cmd run test:rider` passed, 16 tests.
- `npm.cmd run lint -- --max-warnings=0` passed.
- `npx.cmd prettier --check apps/customer-app/__tests__/customer-app.test.js apps/customer-app/src/screens/CustomerNotificationsScreen.js` passed.
- `git diff --check` passed.

### Risks And Follow-Up Items

- Portal Vitest remains locally constrained by the previously documented Vite/esbuild `spawn EPERM` blocker.
- API feature tests still require a PHP 8.3+ runtime; this workstation is documented as PHP 8.2.12 in prior entries.
- The rider notification warning did not reproduce under an isolated red test in this run, so rider production code was not changed.

### Recommended Next Priorities

- Re-run portal notification and dispatch board tests in an environment that allows Vite/esbuild child-process spawning.
- Continue converting remaining mutation feedback in mobile screens to cache or mutation-derived state where it reduces duplicate UI state.
- Validate the launch evidence and dispatch SLA drill in staging once monitoring credentials and backup-host access are available.

## 2026-04-20 - Maps provider fallback alert drill

### Issues Found

- The production readiness gap still called out maps provider dashboard alerts, but the repository did not have a dedicated drill for validating provider quota/error alerts or app-level fallback alerts.
- `MapsProviderService` logged Google Maps fallback events with a readable warning message, but the log context did not include a stable `event` field for log-drain matching.
- The engineering alignment doc still listed native GPS permission handling as missing even though the customer address flow now has an Expo foreground-location helper and regression coverage.

### Fixes Implemented

- Added a stable `google_maps_provider_fallback_activated` log event with provider, fallback provider, operation, and error context.
- Extended the maps provider unit coverage to assert the structured fallback log contract when Distance Matrix falls back to demo estimates.
- Added `docs/ops/maps-provider-alert-drill.md` with provider dashboard alert setup, log-drain rule setup, a staging fallback drill, evidence expectations, and escalation guidance.
- Added maps provider alert evidence fields to the launch evidence record.
- Updated production readiness and engineering alignment docs so maps hardening now points at live provider credentials, dashboard alerts, and the staging fallback alert drill instead of the already-implemented customer GPS flow.
- Linked the maps provider alert drill from the root README runbook list.

### Enhancements Implemented

- Split maps monitoring into provider-side alerts for quota/billing/API errors and app-side log alerts for fallback behavior.
- Documented a one-off `php artisan tinker` drill that produces fallback telemetry without changing persistent staging configuration.

### Files Changed

- `README.md`
- `apps/api/app/Modules/Shared/Services/MapsProviderService.php`
- `apps/api/tests/Unit/Shared/MapsProviderServiceTest.php`
- `docs/ops/maps-provider-alert-drill.md`
- `docs/ops/launch-evidence.md`
- `docs/ops/production-readiness.md`
- `docs/talabix-engineering-pack-alignment.md`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- Red phase attempt: `php artisan test tests/Unit/Shared/MapsProviderServiceTest.php --filter "falls back to demo estimates"` is blocked before test discovery because local PHP is 8.2.12 and Composer requires PHP 8.3+.
- `php -l app\Modules\Shared\Services\MapsProviderService.php` passed.
- `php -l tests\Unit\Shared\MapsProviderServiceTest.php` passed.
- `npx.cmd prettier --write docs/ops/maps-provider-alert-drill.md docs/ops/production-readiness.md` formatted the new/updated Markdown.
- `npx.cmd prettier --check README.md docs/ops/maps-provider-alert-drill.md docs/ops/launch-evidence.md docs/ops/production-readiness.md docs/talabix-engineering-pack-alignment.md docs/continuous-improvement-log.md` passed.
- `git diff --check` passed.

### Risks And Follow-Up Items

- The new maps provider unit expectation still needs to run in CI or a local PHP 8.3+ environment.
- Staging still needs live Google Maps credentials, provider dashboard alerts, the fallback log-drain rule, and drill evidence before the maps launch gap can be closed.
- The staging-only dispatch SLA and MySQL restore drills remain blocked locally until monitoring, database, backup-disk, and maintenance-host access are available.

## 2026-04-19 - Launch evidence record for SLA and restore drills

### Issues Found

- The dispatch SLA and MySQL restore drill runbooks both required evidence to be attached to a launch record, but the repository did not yet have a concrete launch evidence file.
- The dispatch SLA alert drill described the event fields, but staging operators still had to infer the monitor rule name, window, severity routing, and evidence fields.
- The restore drill evidence table did not capture archive size, checksum, extract/import status, or cleanup verification.

### Fixes Implemented

- Added `docs/ops/launch-evidence.md` as the central pre-launch evidence record for staging deployment, baseline monitoring, dispatch SLA alerting, MySQL restore verification, and incident drills.
- Added concrete dispatch SLA log-monitor setup guidance with the minimum rule fields, alert window, severity handling, notification route, and evidence expectations.
- Expanded MySQL restore evidence capture to include archive size/checksum, extract/import results, and cleanup verification.
- Linked the launch evidence record from the production readiness runbook, root README, and engineering alignment backlog.

### Enhancements Implemented

- Added explicit evidence hygiene rules so secrets, DSNs, object-storage keys, customer data, and full backup contents stay out of git.
- Kept the monitoring guidance provider-neutral so it can be applied to Datadog, New Relic, Sentry logs, a VM log drain, or another selected staging monitor.

### Files Changed

- `README.md`
- `docs/ops/launch-evidence.md`
- `docs/ops/dispatch-sla-alert-drill.md`
- `docs/ops/mysql-backup-restore-drill.md`
- `docs/ops/production-readiness.md`
- `docs/talabix-engineering-pack-alignment.md`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- `npx.cmd prettier --check README.md docs/ops/launch-evidence.md docs/ops/dispatch-sla-alert-drill.md docs/ops/mysql-backup-restore-drill.md docs/ops/production-readiness.md docs/talabix-engineering-pack-alignment.md docs/continuous-improvement-log.md` passed.
- `git diff --check` passed.

### Risks And Follow-Up Items

- Staging monitoring still must be configured in the selected provider before the dispatch SLA drill can be marked passing.
- The first staging MySQL restore drill still requires staging database, backup-disk, and maintenance-host access.

## 2026-04-19 - Customer address GPS permission handling

### Issues Found

- The customer address form only supported typed coordinates or map-search suggestions, so customers had no native current-location action in the saved-address flow.
- The mobile shell did not isolate Expo foreground-location permission checks from address form state, making denied GPS permission and disabled/unavailable location services easy to mishandle.
- The worktree already contained unrelated backup, deploy, dispatch, and delivery-exception changes; this slice preserved those edits and only added the customer GPS address-flow changes.

### Fixes Implemented

- Added a safe customer location helper around `expo-location` foreground permissions, device location-service availability, and `getCurrentPositionAsync`.
- Configured the customer Expo app with the `expo-location` config plugin and a foreground-location permission purpose string.
- Added a "Use current location" action to `AddressBookScreen` that fills only latitude and longitude while preserving manual address fields.
- Added localized English and Arabic feedback for finding location, permission denied, unavailable location, and successful coordinate capture.
- Added coordinate test IDs so the customer address flow can be regression-tested without coupling to implementation details.

### Enhancements Implemented

- Added `expo-location` to the customer Expo app dependencies using the SDK 54 bundled version.
- Added focused helper tests for permission, disabled-services, and current-position failure paths.
- Added customer screen tests covering coordinate fill, manual-entry preservation, Arabic denied copy, and unavailable fallback copy.

### Files Changed

- `apps/customer-app/package.json`
- `package-lock.json`
- `apps/customer-app/app.json`
- `apps/customer-app/src/location.js`
- `apps/customer-app/src/screens/AddressBookScreen.js`
- `apps/customer-app/__tests__/location.test.js`
- `apps/customer-app/__tests__/customer-app.test.js`
- `packages/shared/src/i18n/index.js`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- Red phase: `npm.cmd --workspace @talabix/customer-app run test -- location.test.js customer-app.test.js -t "requestCurrentLocation|fills current GPS|localized Arabic|current location is unavailable"` failed because `src/location.js`, the current-location action, and coordinate test IDs were not implemented yet.
- Green phase: `npm.cmd --workspace @talabix/customer-app run test -- location.test.js customer-app.test.js -t "requestCurrentLocation|fills current GPS|localized Arabic|current location is unavailable"` passed, 7 tests.
- `npm.cmd --workspace @talabix/customer-app run test` passed, 34 tests; the suite still prints pre-existing React `act(...)` warnings from `CustomerNotificationsScreen`.
- `npm.cmd run i18n:audit` passed.
- `npm.cmd run lint -- --max-warnings=0` passed.

### Risks And Follow-Up Items

- The full customer Jest suite is passing but still not pristine because of existing notification-screen `act(...)` warnings unrelated to the GPS address flow.
- Expo native permission prompts still require manual simulator/device verification before mobile release because Jest mocks the helper boundary.

## 2026-04-19 - Dispatch SLA alert wiring

### Issues Found

- Dispatch pickup and delivery-exception SLA breaches were visible in API/UI payloads, but there was no scheduled operational signal for monitoring tools to alert on.
- The launch runbook listed the dispatch SLA drill as an open gap without a concrete command, log event, or evidence checklist.

### Fixes Implemented

- Added an `ops:dispatch-sla-alerts` Artisan command that snapshots breached pickup assignments and unresolved breached delivery exceptions.
- Scheduled the command every five minutes with overlap protection.
- Added `DISPATCH_SLA_ALERT_THRESHOLD` so staging and production can tune when the structured warning log should alert.
- Added a dispatch SLA alert drill runbook covering staging setup, log-drain matching, alert confirmation, and evidence capture.
- Updated production readiness monitoring guidance to include the new `dispatch_sla_breach_window_exceeded` signal.

### Enhancements Implemented

- Added feature coverage for the scheduler entry and structured warning context expected by log-based monitoring.
- Included sample order UUIDs and oldest breach ages in the alert snapshot so ops can triage from the first alert page.

### Files Changed

- `apps/api/.env.example`
- `apps/api/app/Modules/Dispatch/Services/DispatchSlaBreachMonitor.php`
- `apps/api/config/services.php`
- `apps/api/routes/console.php`
- `apps/api/tests/Feature/Ops/DispatchSlaAlertTest.php`
- `docs/ops/dispatch-sla-alert-drill.md`
- `docs/ops/production-readiness.md`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- Red phase attempt: `php artisan test tests/Feature/Ops/DispatchSlaAlertTest.php` is blocked before test discovery because local PHP is 8.2.12 and Composer requires PHP 8.3+.
- `php -l` passed for `apps/api/app/Modules/Dispatch/Services/DispatchSlaBreachMonitor.php`, `apps/api/routes/console.php`, `apps/api/config/services.php`, and `apps/api/tests/Feature/Ops/DispatchSlaAlertTest.php`.
- `npx.cmd prettier --check docs/continuous-improvement-log.md docs/ops/production-readiness.md docs/ops/dispatch-sla-alert-drill.md` passed.
- `git diff --check` passed.
- Post-implementation `php artisan test tests/Feature/Ops/DispatchSlaAlertTest.php` remains blocked locally by the PHP 8.2.12 runtime.

### Risks And Follow-Up Items

- The log signal still needs to be connected in the selected staging/production monitoring tool.
- Run the dispatch SLA alert drill in staging and attach evidence before launch.
- Laravel feature tests need a PHP 8.3+ local or CI runtime to execute the new command coverage.

## 2026-04-19 - Delivery exception SLA timeout visibility

### Issues Found

- Rider delivery exceptions stayed open for support/reassignment, but the payload did not expose whether the exception response window was still healthy, due soon, or breached.
- Ops dispatch cards could show the delivery issue reason and note, but not the response timeout or required escalation action.
- The shared test command used `node --test` with multiple file paths, which triggers the workstation's `spawn EPERM` policy even when the individual test files can run in-process.

### Fixes Implemented

- Added a shared API `DeliveryExceptionSla` snapshot helper with configurable response target and warning windows.
- Added `response_sla` to active delivery exception payloads returned to rider/current-order views and ops dispatch projections.
- Added env knobs for `DELIVERY_EXCEPTION_RESPONSE_SLA_MINUTES` and `DELIVERY_EXCEPTION_RESPONSE_WARNING_MINUTES`.
- Extended shared validation contracts so customer/rider/portal clients preserve the nested exception timeout payload.
- Updated the ops dispatch board to show the exception response SLA label, elapsed/target window, and escalation action guidance.
- Replaced the shared test command with a single-process runner so the shared i18n and schema tests can run despite the local child-process spawn restriction.

### Enhancements Implemented

- Added API feature expectations for breached exception response windows on rider assignment and ops dispatch payloads.
- Added a shared schema regression test proving exception SLA snapshots are not stripped by contract parsing.
- Added portal regression coverage for the visible exception response timeout copy.

### Files Changed

- `package.json`
- `scripts/run-shared-tests.mjs`
- `apps/api/.env.example`
- `apps/api/app/Modules/Dispatch/Services/DispatchRouteProjectionService.php`
- `apps/api/app/Modules/Orders/Resources/OrderResource.php`
- `apps/api/app/Modules/Orders/Support/DeliveryExceptionSla.php`
- `apps/api/config/services.php`
- `apps/api/lang/ar/messages.php`
- `apps/api/lang/en/messages.php`
- `apps/api/tests/Feature/Dispatch/DispatchTest.php`
- `apps/api/tests/Feature/Orders/RiderDeliveryFlowTest.php`
- `apps/portal-web/src/App.test.jsx`
- `apps/portal-web/src/features/ops/DispatchBoard.jsx`
- `apps/portal-web/src/sample-data.js`
- `packages/shared/src/validation/schemas.js`
- `packages/shared/src/validation/schemas.test.js`
- `docs/ops/production-readiness.md`
- `docs/talabix-engineering-pack-alignment.md`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- Red phase: `node packages/shared/src/validation/schemas.test.js` failed because `response_sla` was stripped from delivery exception schemas.
- `node scripts/run-shared-tests.mjs` passed, 6 tests.
- `npm.cmd run test:shared` passed, 6 tests.
- `php -l` passed for `apps/api/app/Modules/Orders/Support/DeliveryExceptionSla.php`, `apps/api/app/Modules/Dispatch/Services/DispatchRouteProjectionService.php`, and `apps/api/app/Modules/Orders/Resources/OrderResource.php`.
- `php -l` passed for `apps/api/config/services.php`, `apps/api/lang/en/messages.php`, `apps/api/lang/ar/messages.php`, `apps/api/tests/Feature/Dispatch/DispatchTest.php`, and `apps/api/tests/Feature/Orders/RiderDeliveryFlowTest.php`.
- `npm.cmd run lint -- --max-warnings=0` passed.
- `npm.cmd run i18n:audit` passed.
- `npx.cmd prettier --check package.json scripts/run-shared-tests.mjs apps/portal-web/src/App.test.jsx apps/portal-web/src/features/ops/DispatchBoard.jsx apps/portal-web/src/sample-data.js packages/shared/src/validation/schemas.js packages/shared/src/validation/schemas.test.js docs/continuous-improvement-log.md docs/ops/production-readiness.md docs/talabix-engineering-pack-alignment.md` passed.
- `git diff --check` passed.

### Risks And Follow-Up Items

- `npm.cmd --workspace @talabix/portal-web run test -- --run src/App.test.jsx -t "renders dispatch actions"` is still blocked locally by Vite/esbuild `spawn EPERM`.
- `php artisan test tests/Feature/Orders/RiderDeliveryFlowTest.php --filter "delivery exception"` is still blocked locally because PHP is 8.2.12 and Composer requires PHP 8.3+.
- The next launch-hardening slice should wire monitoring/alerts for breached exception SLA counts and run the first staging restore drill.

## 2026-04-19 - MySQL backup verification baseline

### Issues Found

- The backup package dependency was present, but the backup config and scheduler slice was still uncommitted.
- The scheduler only had cleanup and a generic backup run; it did not run backup health monitoring.
- The published backup config still used placeholder notification routing and did not enable archive verification.
- MySQL and MariaDB dump settings did not request single-transaction dumps, which is safer for InnoDB production traffic.
- Restore-drill evidence was still only described as an open launch gap.

### Fixes Implemented

- Added `apps/api/config/backup.php` as the Talabix backup config with env-driven backup disks, notification email, retention thresholds, health-check thresholds, and archive verification enabled.
- Scheduled daily backup cleanup at 01:00, DB-only backup creation at 01:30, and backup health monitoring at 10:00, each with overlap protection.
- Configured MySQL and MariaDB dumps to use single-transaction mode by default.
- Added backup operation tests covering schedule registration, DB-only backup execution, archive verification, notification placeholder removal, monitored destination alignment, and dump safety.
- Added a MySQL restore-drill runbook with the evidence table expected before launch and quarterly afterward.

### Enhancements Implemented

- Added backup environment variables to `apps/api/.env.example`.
- Linked the restore-drill runbook from the root README and production readiness runbook.
- Updated the deploy documentation to call out backup variables inside the encoded API env file.
- Reframed the remaining launch gap from "implement backup verification" to "run the first staging restore drill and attach evidence."

### Files Changed

- `README.md`
- `apps/api/.env.example`
- `apps/api/config/backup.php`
- `apps/api/config/database.php`
- `apps/api/routes/console.php`
- `apps/api/tests/Feature/Ops/BackupOperationsTest.php`
- `deploy/README.md`
- `docs/ops/mysql-backup-restore-drill.md`
- `docs/ops/production-readiness.md`
- `docs/talabix-engineering-pack-alignment.md`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- `php -l` passed for `apps/api/routes/console.php`, `apps/api/config/backup.php`, `apps/api/config/database.php`, and `apps/api/tests/Feature/Ops/BackupOperationsTest.php`.
- `composer validate --no-check-publish` passed.
- `composer install --dry-run --no-interaction --ignore-platform-req=php --ignore-platform-req=ext-pcntl --ignore-platform-req=ext-posix` passed.
- `npx.cmd prettier --check README.md deploy/README.md docs/ops/production-readiness.md docs/ops/mysql-backup-restore-drill.md docs/talabix-engineering-pack-alignment.md` passed.
- `git diff --check` passed.
- `php artisan test tests/Feature/Ops/BackupOperationsTest.php` is blocked locally because PHP is 8.2.12 and Composer requires PHP 8.3+ before Laravel can boot.

### Risks And Follow-Up Items

- Run `php artisan test tests/Feature/Ops/BackupOperationsTest.php` in a PHP 8.3+ environment or CI before committing this slice.
- Configure staging `BACKUP_DISKS`, `BACKUP_NOTIFICATION_EMAIL`, `BACKUP_ARCHIVE_PASSWORD`, object storage credentials, and retention thresholds in `apps/api/.env`.
- Run the first staging restore drill and attach the evidence table to the launch record.
- The previously published `apps/api/lang/vendor/backup` translation files remain uncommitted and should either be intentionally committed for notification copy overrides or removed before finalizing the slice.

## 2026-04-19 - Readiness checks, Docker VM deploy target, and maps fallback hardening

### Issues Found

- The production hardening runbook still had three open first-step items: API readiness checks, a concrete deployment target/CI-CD path, and production maps behavior.
- The existing Sentry/backup dependency work in the dirty tree pulled Symfony 8 bridge packages into `composer.lock`; those packages require PHP 8.4 and would not match the repo's PHP 8.3 target.
- Local API runtime verification remains blocked because the workstation PHP is 8.2.12 and PHPUnit now uses PHP 8.3 typed constants.
- Customer address search fallback copy did not clearly tell users they could continue with manual address and coordinate entry when map suggestions were unavailable.

### Fixes Implemented

- Added `GET /api/v1/readiness` with a shared `X-Talabix-Readiness-Key` header and per-check status for database, cache, queue, and Reverb configuration.
- Added readiness feature tests and Google Maps provider unit tests for place search, Distance Matrix estimates, and demo fallback behavior.
- Hardened `MapsProviderService` to support Google Places Find Place and Distance Matrix calls with configurable timeout, location bias, region, and demo fallback.
- Chose the deployment target as a Linux Docker Compose VM behind a TLS reverse proxy and added `.github/workflows/deploy.yml`.
- Added a VM compose overlay, portal Nginx image, and deployment instructions under `deploy/`.
- Added customer address fallback UX copy and regression coverage.
- Constrained `symfony/options-resolver` and `symfony/psr-http-message-bridge` to `>=7.4 <8.0` so Sentry remains compatible with PHP 8.3 instead of locking PHP 8.4-only Symfony 8 packages.

### Enhancements Implemented

- Added deploy-time readiness smoke checks to the GitHub Actions workflow.
- Added `READINESS_CHECK_KEY`, Google Maps production knobs, and `PORTAL_FORWARD_PORT` to env examples.
- Wired Sentry exception capture and a JSON stderr log channel for deployable runtime observability.
- Updated the production runbook and engineering alignment doc to reflect the selected deployment target and remaining launch gaps.

### Files Changed

- `.github/workflows/deploy.yml`
- `.env.example`
- `apps/api/.env.example`
- `apps/api/app/Modules/Shared/Controllers/ReadinessController.php`
- `apps/api/app/Modules/Shared/Services/ReadinessCheckService.php`
- `apps/api/app/Modules/Shared/Services/MapsProviderService.php`
- `apps/api/bootstrap/app.php`
- `apps/api/composer.json`
- `apps/api/composer.lock`
- `apps/api/config/logging.php`
- `apps/api/config/services.php`
- `apps/api/routes/api.php`
- `apps/api/tests/Feature/Ops/ReadinessTest.php`
- `apps/api/tests/Unit/Shared/MapsProviderServiceTest.php`
- `apps/customer-app/__tests__/customer-app.test.js`
- `apps/customer-app/src/screens/AddressBookScreen.js`
- `deploy/README.md`
- `deploy/docker-compose.vm.yml`
- `deploy/nginx/portal.conf`
- `deploy/portal.Dockerfile`
- `docs/ops/production-readiness.md`
- `docs/talabix-engineering-pack-alignment.md`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- Red test attempt: `php artisan test tests/Feature/Ops/ReadinessTest.php tests/Unit/Shared/MapsProviderServiceTest.php` is blocked locally by PHP 8.2.12 parsing PHPUnit's PHP 8.3 typed constant syntax.
- `php -l` passed for touched API PHP source and test files.
- `composer validate --no-check-publish` passed.
- `composer install --dry-run --no-interaction --ignore-platform-req=php --ignore-platform-req=ext-pcntl --ignore-platform-req=ext-posix` passed with the updated lock file.
- `npm.cmd run lint -- --max-warnings=0` passed.
- `npm.cmd run i18n:audit` passed.
- `npm.cmd run test:shared` passed, 4 tests.
- `npm.cmd --workspace @talabix/portal-web run test -- --run` passed, 20 tests.
- `npm.cmd run test:customer` passed, 26 tests, with pre-existing `CustomerNotificationsScreen` act warnings.
- `npm.cmd run test:rider` passed, 15 tests, with a pre-existing `RiderNotificationsScreen` act warning.
- `npm.cmd run build --workspaces --if-present` passed, with the existing portal chunk-size warning.
- `docker compose -f docker-compose.yml -f deploy/docker-compose.vm.yml config --quiet` passed.
- `npx.cmd prettier --check .github/workflows/deploy.yml deploy/README.md deploy/docker-compose.vm.yml docs/ops/production-readiness.md docs/talabix-engineering-pack-alignment.md apps/customer-app/__tests__/customer-app.test.js apps/customer-app/src/screens/AddressBookScreen.js apps/api/composer.json` passed.
- `git diff --check` passed.

### Risks And Follow-Up Items

- The new API readiness/maps tests need to be run in CI or a local PHP 8.3+ environment.
- The deploy workflow has been encoded but not executed against a real GitHub Environment/VM.
- Google Maps provider behavior uses the configured API key and official web-service endpoints, but live credentials, quotas, and provider dashboard alerts still need environment-level setup.
- Native GPS permission handling is not yet implemented in the Expo app; this run only improved backend provider fallback and customer manual-entry UX.
- Backup package dependencies are present in the dirty tree, but automated backup verification and restore evidence are still open.

### Recommended Next Priorities

- Provision the staging VM, add GitHub Environment secrets, and run `.github/workflows/deploy.yml` end to end.
- Run the API readiness/maps tests in PHP 8.3 CI and fix any environment-specific failures.
- Add monitoring alerts for `/api/v1/readiness`, queue depth, failed jobs, Reverb, Maps provider fallback rate, database, and Redis.
- Implement backup verification and a documented restore drill.
- Add native GPS permission handling in the customer app address flow.

## 2026-04-19 - Production readiness runbook baseline

### Issues Found

- The latest backlog identified staging and production hardening as the next major priority after the i18n audit and mobile test-harness stabilization work.
- The repo had local Docker unavailable and local PHP 8.2.12, while the API requires PHP 8.3+, so API runtime work could not be verified safely on this workstation.
- Existing docs covered local development and architecture decisions but did not yet define a production deployment, monitoring, backup, rollback, or incident-response baseline.

### Fixes Implemented

- Added a production readiness runbook under `docs/ops/production-readiness.md`.
- Defined the staging/production environment model, required runtime processes, required secrets, release checklist, monitoring baseline, backup policy, rollback process, and incident-response flow.
- Linked the new operations runbook from the root `README.md`.

### Enhancements Implemented

- Converted the broad production-hardening backlog item into concrete launch gates and follow-up slices.
- Captured readiness endpoint work, CI/CD encoding, monitoring tool selection, backup restore evidence, maps hardening, and SLA/timeout handling as explicit next items.

### Files Changed

- `docs/ops/production-readiness.md`
- `README.md`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- `npx.cmd prettier --check README.md docs/ops/production-readiness.md docs/continuous-improvement-log.md` passed after formatting the touched Markdown files.

### Risks And Follow-Up Items

- API health/readiness endpoint work remains unimplemented because this workstation cannot currently run the API test loop.
- Deployment automation still needs a chosen hosting target before a CI/CD workflow can be encoded.
- Monitoring and backup policies are now specified, but provider/tool selection and implementation remain open.

### Recommended Next Priorities

- Add an API readiness endpoint with database, Redis, queue, and Reverb dependency checks in a PHP 8.3+ or Docker-capable environment.
- Choose the staging/production deployment target and encode the runbook checklist into CI/CD.
- Start maps production hardening with real provider credentials, GPS permission UX, and provider-failure handling.

## 2026-04-19 - i18n audit fix and CustomerHomeScreen test harness stabilization

### Issues Found

- The `npm run i18n:audit` quality gate failed because `CustomerHomeScreen` contained 5 hardcoded English string literals in user-facing props: the promo banner description, eyebrow, and title, the daily offers section header, and the category picker section header.
- The customer Jest suite emitted a persistent React `act(...)` warning around `CustomerHomeScreen` query updates because TanStack Query's `notifyManager` scheduled batch state updates via `setTimeout`, which fired outside any `act()` boundary.

### Fixes Implemented

- Added 5 new shared i18n keys (`promoBannerEyebrow`, `promoBannerTitle`, `promoBannerDescription`, `dailyOffersTitle`, `categoryPickerTitle`) under `customer.home` in both English and Arabic translations.
- Replaced the 5 hardcoded literal props in `CustomerHomeScreen` with `t()` calls using the new shared keys.
- Configured TanStack Query's `notifyManager.setScheduler` in the customer test `beforeEach` to route batch notifications through `act()`, eliminating the `CustomerHomeScreen` act() warning at its source.
- Restored the default `setTimeout` scheduler in `afterEach` to avoid leaking test configuration.

### Enhancements Implemented

- The `npm run i18n:audit` quality gate now passes cleanly with zero hardcoded user-facing strings across all audited frontend surfaces.
- The `CustomerHomeScreen` act() warning that persisted across every prior log entry is now resolved.
- Remaining act() warnings in the customer suite are scoped to `CustomerNotificationsScreen` mutation `onSuccess` callbacks (a separate, pre-existing pattern).

### Files Changed

- `packages/shared/src/i18n/index.js`
- `apps/customer-app/src/screens/CustomerHomeScreen.js`
- `apps/customer-app/__tests__/customer-app.test.js`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- `npm run i18n:audit` passed: no hardcoded user-facing frontend strings found.
- `npm run test:customer` passed, 25 tests.
- `npm run test:rider` passed, 15 tests.
- `npm run test:shared` passed, 4 tests.
- `npm run lint -- --max-warnings=0` passed with no warnings.
- `npx prettier --check` passed on all changed files.

### Risks And Follow-Up Items

- The remaining `CustomerNotificationsScreen` act() warnings come from `setFeedback` calls inside mutation `onSuccess` callbacks. These are cosmetic and do not affect test correctness.
- Portal Vitest remains blocked locally by the sandbox `spawn EPERM` behavior documented in prior entries.
- API tests remain blocked on this workstation until PHP 8.3+ is available.

### Recommended Next Priorities

- Review and commit the broad dirty worktree as one product slice.
- Finish staging/production hardening: deployment automation, monitoring, backups.
- Harden production maps behavior: real provider credentials, GPS permission handling, and graceful provider-failure UX.

## 2026-04-19 - Rider availability and navigation pending-state hardening

### Issues Found

- Rider availability toggles stayed tappable while the availability mutation was pending.
- Delivery navigation handoff controls could submit repeated external URL opens while the first handoff was still in flight.
- Rider home availability error handling did not surface a friendly fallback message.
- The worktree already contained the broader mobile, offer, notification, and portal slices from prior runs; this run preserved that work and only extended the rider pending-state path.

### Fixes Implemented

- Added scoped pending feedback to rider availability updates, including disabled `Go available`/`Go offline` controls and an `Updating availability` label for the active toggle.
- Added a ref-backed navigation in-flight guard in the rider delivery screen so fast repeated taps cannot enqueue duplicate external handoffs before React rerenders.
- Disabled pickup and drop-off navigation buttons while a handoff is pending and labeled the active button `Opening navigation`.
- Added localized English and Arabic strings for availability pending and fallback error copy.

### Enhancements Implemented

- Added rider regression coverage proving availability updates cannot be submitted twice while pending.
- Added rider regression coverage proving navigation handoffs cannot be opened twice while pending.
- Kept the existing rider assignment, pickup, delivery completion, and notification mark-read pending-state coverage green.

### Files Changed

- `apps/rider-app/__tests__/rider-app.test.js`
- `apps/rider-app/src/screens/DeliveryScreen.js`
- `apps/rider-app/src/screens/RiderHomeScreen.js`
- `packages/shared/src/i18n/index.js`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- Red phase: `npm.cmd --workspace @talabix/rider-app run test -- --runTestsByPath __tests__/rider-app.test.js` failed because `Updating availability` and `Opening navigation` pending states were absent.
- Green phase: the same rider test file passed after adding pending labels, disabled controls, and the navigation in-flight guard.
- Final validation: `npm.cmd run test:rider` passed, 15 tests.
- Final validation: `npx.cmd eslint apps/rider-app/__tests__/rider-app.test.js apps/rider-app/src/screens/RiderHomeScreen.js apps/rider-app/src/screens/DeliveryScreen.js packages/shared/src/i18n/index.js --max-warnings=0` passed.
- Final validation: `npx.cmd prettier --check apps/rider-app/__tests__/rider-app.test.js apps/rider-app/src/screens/RiderHomeScreen.js apps/rider-app/src/screens/DeliveryScreen.js packages/shared/src/i18n/index.js` passed.
- Attempted `npm.cmd run i18n:audit`, but it still fails on pre-existing user-facing literals in `apps/customer-app/src/screens/CustomerHomeScreen.js`.

### Risks And Follow-Up Items

- The repo i18n audit is now the highest-confidence next fix: move the remaining `CustomerHomeScreen` literal props into `packages/shared/src/i18n/index.js`.
- Customer Jest still emits the pre-existing React `act(...)` warning around `CustomerHomeScreen` query updates.
- Portal Vitest remains blocked locally by the sandbox `spawn EPERM` behavior documented in prior entries.
- API tests remain blocked on this workstation until PHP 8.3+ is available.
- Broad dirty worktree changes from prior product, offer, notification, and portal slices should be reviewed together before commit.

### Recommended Next Priorities

- Move the remaining `CustomerHomeScreen` literals flagged by `npm.cmd run i18n:audit` into shared i18n strings.
- Stabilize the CustomerHomeScreen test harness to remove the lingering `act(...)` warning.
- Review the broad dirty worktree as one product slice before committing.

## 2026-04-19 - Customer mutation pending-state hardening

### Issues Found

- Customer profile saves kept the active save button available while the update mutation was pending.
- Address creation/update and default-address mutation controls did not expose in-flight labels or disabled states.
- Cart quantity controls stayed tappable during quantity updates, allowing repeat add/remove submissions against the same cart snapshot.
- Reorder controls already had pending-state protection, so this run focused on the remaining customer mutation buttons from the prior next-priority list.

### Fixes Implemented

- Added a profile save pending state that disables the submit button and changes the label to `Saving profile`.
- Added address save pending protection that disables save, default toggle, and cancel controls while the save mutation is in flight.
- Added scoped default-address pending feedback with a `Making default` label and disabled default/edit controls during the update.
- Added cart quantity pending feedback with active `Adding`/`Removing` labels and disabled quantity controls while a cart quantity update is pending.

### Enhancements Implemented

- Added customer regression coverage for duplicate profile saves, address saves, default-address updates, and cart quantity changes.
- Preserved the existing checkout, notification mark-read, and reorder pending-state behavior while extending the same duplicate-submit protection to the remaining high-risk customer flows.

### Files Changed

- `apps/customer-app/__tests__/customer-app.test.js`
- `apps/customer-app/src/screens/AddressBookScreen.js`
- `apps/customer-app/src/screens/CartScreen.js`
- `apps/customer-app/src/screens/CustomerProfileScreen.js`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- Red phase: `npm.cmd --workspace @talabix/customer-app run test -- --runTestsByPath __tests__/customer-app.test.js --testNamePattern "prevents duplicate profile|prevents duplicate address|prevents duplicate default-address|prevents duplicate cart quantity"` failed because the pending labels were absent.
- Green phase: the same targeted customer tests passed after adding pending labels and disabled states.
- Final validation: `npm.cmd run test:customer` passed, 25 tests, with the existing CustomerHomeScreen `act(...)` warning still present.
- Final validation: `npm.cmd run lint -- --max-warnings=0` passed.
- Final validation: `npx.cmd prettier --check apps/customer-app/__tests__/customer-app.test.js apps/customer-app/src/screens/CartScreen.js apps/customer-app/src/screens/AddressBookScreen.js apps/customer-app/src/screens/CustomerProfileScreen.js` passed.

### Risks And Follow-Up Items

- Customer Jest still emits the pre-existing React `act(...)` warning around `CustomerHomeScreen` query updates.
- Portal Vitest remains blocked locally by the sandbox `spawn EPERM` behavior documented in prior entries.
- API tests remain blocked on this workstation until PHP 8.3+ is available.
- Broad dirty worktree changes from prior product, offer, notification, and portal slices should be reviewed together before commit.

### Recommended Next Priorities

- Add pending/disabled protection to rider availability toggles and any navigation handoff controls that perform async work.
- Stabilize the CustomerHomeScreen test harness to remove the lingering `act(...)` warning.
- Review the broad dirty worktree as one product slice before committing.

## 2026-04-19 - Mobile critical action pending-state hardening

### Issues Found

- Customer checkout allowed the active place-order control to remain visually available while the checkout mutation was pending.
- Rider assignment acceptance, pickup confirmation, and delivery completion controls did not expose pending labels or disabled states during in-flight mutations.
- The rider app `AccentButton` did not accept a disabled state, so high-risk workflow buttons could not consistently block duplicate taps.
- The worktree already contained a broad uncommitted offer/order/notification slice from prior runs; this run preserved that work and only extended the pending-state hardening path.

### Fixes Implemented

- Added a checkout pending state that disables the customer `Place COD order` control and changes the label to `Placing order`.
- Added pending/disabled states for rider assignment acceptance from the assignment queue.
- Added pending/disabled states for rider assignment acceptance, pickup confirmation, and delivery completion from the delivery detail screen.
- Extended the rider app `AccentButton` to support disabled styling and native `Pressable` blocking, matching the existing `SecondaryButton` behavior.

### Enhancements Implemented

- Added customer regression coverage proving checkout cannot be submitted twice while the first submission is pending.
- Added rider regression coverage for duplicate assignment acceptance, delivery-screen acceptance, pickup confirmation, and delivery completion.
- Kept the existing notification pending-state behavior intact while covering the remaining critical mobile workflow actions named in the previous next-priority list.

### Files Changed

- `apps/customer-app/__tests__/customer-app.test.js`
- `apps/customer-app/src/screens/CartScreen.js`
- `apps/rider-app/__tests__/rider-app.test.js`
- `apps/rider-app/src/screens/AssignmentsScreen.js`
- `apps/rider-app/src/screens/DeliveryScreen.js`
- `apps/rider-app/src/ui.js`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- Red phase: `npm.cmd --workspace @talabix/customer-app run test -- --runTestsByPath __tests__/customer-app.test.js --testNamePattern "prevents duplicate checkout"` failed because the checkout pending `Placing order` state was absent.
- Red phase: `npm.cmd --workspace @talabix/rider-app run test -- --runTestsByPath __tests__/rider-app.test.js --testNamePattern "prevents duplicate rider assignment|prevents duplicate delivery-screen|prevents duplicate pickup|prevents duplicate delivery completions"` failed because the rider pending labels were absent.
- Green phase: the same targeted customer and rider tests passed after the pending-state implementation.
- Final validation: `npm.cmd run test:customer` passed, 21 tests, with the existing CustomerHomeScreen `act(...)` warning still present.
- Final validation: `npm.cmd run test:rider` passed, 13 tests.
- Final validation: `npm.cmd run lint -- --max-warnings=0` passed.
- Final validation: `npx.cmd prettier --check apps/customer-app/__tests__/customer-app.test.js apps/customer-app/src/screens/CartScreen.js apps/rider-app/__tests__/rider-app.test.js apps/rider-app/src/screens/AssignmentsScreen.js apps/rider-app/src/screens/DeliveryScreen.js apps/rider-app/src/ui.js` passed.

### Risks And Follow-Up Items

- Customer Jest still emits the pre-existing React `act(...)` warning around `CustomerHomeScreen` query updates.
- Portal Vitest remains blocked locally by the sandbox `spawn EPERM` behavior documented in prior entries.
- API tests remain blocked on this workstation until PHP 8.3+ is available.
- Broad dirty worktree changes from prior product, offer, notification, and portal slices should be reviewed together before commit.

### Recommended Next Priorities

- Add pending/disabled protection to remaining customer mutation buttons, especially cart quantity changes, profile save, address save/default actions, and reorder.
- Add pending/disabled protection to rider availability toggles and any navigation handoff controls that perform async work.
- Stabilize the CustomerHomeScreen test harness to remove the lingering `act(...)` warning.

## 2026-04-19 - Mobile notification pending-state hardening

### Issues Found

- Customer and rider mobile notification mark-read controls did not show an in-flight state while the update was pending, leaving users without feedback and making repeated taps look available.
- The rider app shared `SecondaryButton` did not support a disabled state, unlike the customer app equivalent.
- Two currently touched portal files had accidental UTF-8 BOM bytes at the first import line.
- The worktree already contained a broad uncommitted mobile/portal notification slice from prior runs; this run preserved that work and only extended the notification hardening path.

### Fixes Implemented

- Added scoped pending detection for customer notification mark-read mutations.
- Added scoped pending detection for rider notification mark-read mutations.
- Disabled the active mark-read control while its mutation is pending and changed the label to `Marking...`.
- Added disabled-state support to the rider app `SecondaryButton`.
- Removed the accidental BOM from the portal app test and merchant notifications board files.

### Enhancements Implemented

- Added customer regression coverage proving the pending mark-read state appears and a second tap while pending does not submit again.
- Added rider regression coverage for the same pending mark-read behavior.
- Kept unread-only cache reconciliation behavior from prior runs intact while improving the tap-level UX.

### Files Changed

- `apps/customer-app/__tests__/customer-app.test.js`
- `apps/customer-app/src/screens/CustomerNotificationsScreen.js`
- `apps/rider-app/__tests__/rider-app.test.js`
- `apps/rider-app/src/screens/RiderNotificationsScreen.js`
- `apps/rider-app/src/ui.js`
- `apps/portal-web/src/App.test.jsx`
- `apps/portal-web/src/features/merchant/MerchantNotificationsBoard.jsx`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- Red phase: `npm.cmd --workspace @talabix/customer-app run test -- --runTestsByPath __tests__/customer-app.test.js --testNamePattern "prevents duplicate customer"` failed because the pending `Marking...` state was absent.
- Red phase: `npm.cmd --workspace @talabix/rider-app run test -- --runTestsByPath __tests__/rider-app.test.js --testNamePattern "prevents duplicate rider"` failed because the pending `Marking...` state was absent.
- Green phase: the same targeted customer and rider tests passed after the pending-state implementation.
- Final validation: `npm.cmd run test:customer` passed, 10 tests.
- Final validation: `npm.cmd run test:rider` passed, 9 tests.
- Final validation: `npm.cmd run lint -- --max-warnings=0` passed.
- Final validation: `npx.cmd prettier --check apps/customer-app/__tests__/customer-app.test.js apps/customer-app/src/screens/CustomerNotificationsScreen.js apps/rider-app/__tests__/rider-app.test.js apps/rider-app/src/screens/RiderNotificationsScreen.js apps/rider-app/src/ui.js apps/portal-web/src/App.test.jsx apps/portal-web/src/features/merchant/MerchantNotificationsBoard.jsx docs/continuous-improvement-log.md` passed.
- Attempted `npm.cmd --workspace @talabix/portal-web run test -- --run src/App.test.jsx`, but Vite/esbuild startup still failed before test execution with `spawn EPERM` in the sandbox.

### Risks And Follow-Up Items

- Portal Vitest still needs to be rerun in CI or a local environment that permits child-process spawning.
- Full API tests were not rerun; PHP runtime compatibility remains a separate workstation constraint from prior entries.
- Broader dirty worktree changes from prior mobile/customer/portal slices should be reviewed together before commit.

### Recommended Next Priorities

- Add pending/disabled states to the remaining high-risk mobile mutation buttons, especially checkout, assignment acceptance, pickup confirmation, and delivery completion.
- Stabilize local portal Vitest execution or rely on CI for portal regression coverage until the `spawn EPERM` blocker is removed.
- Continue localizing customer and rider notification static copy now that the interaction behavior is stable.

## 2026-04-18 - Portal merchant inbox unread-state hardening

### Issues Found

- The portal merchant notification board depended on broad query invalidation after mark-read actions, leaving unread-only UI state dependent on a follow-up refetch.
- Merchant staff could click the active mark-read control again while the mutation was pending.
- Portal coverage did not assert that unread-only merchant notifications disappear after they are acknowledged.
- Pre-existing dirty changes from the previous mobile notification and dependency-pinning slice remain in the worktree; this run preserved them.

### Fixes Implemented

- Added local React Query cache reconciliation for merchant notification mark-read success paths.
- Re-applied the active unread-only filter to the cached merchant inbox so acknowledged notifications are removed immediately.
- Updated cached unread and total counts for the active, unfiltered, and legacy merchant notification query keys.

### Enhancements Implemented

- Added a scoped pending state for the active mark-read button to prevent duplicate submissions.
- Added a descriptive accessible label for merchant notification mark-read actions.
- Added a portal regression test for unread-only merchant notification removal and empty-state/count behavior.

### Files Changed

- `apps/portal-web/src/features/merchant/MerchantNotificationsBoard.jsx`
- `apps/portal-web/src/App.test.jsx`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- `npm.cmd run lint -- --max-warnings=0` passed.
- `npm.cmd --workspace @talabix/portal-web run lint -- --max-warnings=0` passed.
- `npx.cmd prettier --check apps/portal-web/src/features/merchant/MerchantNotificationsBoard.jsx apps/portal-web/src/App.test.jsx docs/continuous-improvement-log.md` passed after formatting the touched files.
- Attempted `npm.cmd --workspace @talabix/portal-web run test -- --run src/App.test.jsx`, but Vite/esbuild startup failed before test execution with `spawn EPERM` in the sandbox.
- Attempted `npm.cmd run test:shared`, but Node's test runner also failed before execution with `spawn EPERM` in the sandbox.

### Risks And Follow-Up Items

- The new portal regression test should be run in a local or CI environment that allows child-process spawning.
- Full API tests were not rerun in this focused portal slice; API verification still depends on a PHP 8.3+ environment.
- Existing mobile notification and dependency-pinning dirty changes should be reviewed together before commit.

### Recommended Next Priorities

- Run the full monorepo test suite outside the sandbox spawn restriction.
- Extend the same duplicate-submit protection to customer and rider mobile notification mark-read controls.
- Review ops notification retry cache behavior after retries from the support console.

## 2026-04-17 - Mobile unread inbox cache hardening

### Issues Found

- Customer and rider notification inboxes kept a notification visible in unread-only mode after the user marked it as read.
- The unread-only cache updated the row read state but did not re-apply the active unread filter, so totals and visible rows could disagree.
- The mark-read mutation also updated an unused base query key while the concrete unfiltered query key could remain stale.
- A pre-existing dirty worktree contains package metadata changes outside this notification slice; this run did not modify or revert them.

### Fixes Implemented

- Updated customer notification cache reconciliation to remove read notifications from unread-only results after mark-read succeeds.
- Updated rider notification cache reconciliation with the same unread-only filtering behavior.
- Updated the concrete unfiltered notification query keys after mark-read so toggling filters has consistent cached state.

### Enhancements Implemented

- Added customer regression coverage for unread-only mark-read behavior and count correctness.
- Added rider regression coverage for unread-only mark-read behavior and count correctness.
- Preserved existing in-app notification business logic and API contracts while improving mobile state consistency.

### Files Changed

- `apps/customer-app/src/screens/CustomerNotificationsScreen.js`
- `apps/customer-app/__tests__/customer-app.test.js`
- `apps/rider-app/src/screens/RiderNotificationsScreen.js`
- `apps/rider-app/__tests__/rider-app.test.js`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- Red phase: `npm.cmd --workspace @talabix/customer-app run test -- --runTestsByPath __tests__/customer-app.test.js` failed because the read notification stayed visible in unread-only mode.
- Red phase: `npm.cmd --workspace @talabix/rider-app run test -- --runTestsByPath __tests__/rider-app.test.js` failed because the read notification stayed visible in unread-only mode.
- Green phase: `npm.cmd --workspace @talabix/customer-app run test -- --runTestsByPath __tests__/customer-app.test.js` passed, 9 tests.
- Green phase: `npm.cmd --workspace @talabix/rider-app run test -- --runTestsByPath __tests__/rider-app.test.js` passed, 8 tests.
- Final validation: `npm.cmd run test:customer` passed, 9 tests.
- Final validation: `npm.cmd run test:rider` passed, 8 tests.
- Final validation: `npm.cmd run lint -- --max-warnings=0` passed with no warnings.

### Risks And Follow-Up Items

- Full monorepo build and API tests were not rerun in this focused mobile slice; API verification still depends on a PHP 8.3+ environment.
- Continue localizing mobile notification screen static labels and queued timestamp copy.

### Recommended Next Priorities

- Continue mobile notification UI localization for screen chrome, read-state pills, and feedback messages.
- Review portal merchant inbox and ops support console notification/status cache behavior for the same stale-filter pattern.
- Run full monorepo build/test and API tests in an environment with the required PHP 8.3+ runtime.

## 2026-04-16 - i18n commit verification checkpoint

### Validation Completed

- `npm.cmd run i18n:audit` - passed.
- `npm.cmd run lint` - passed.
- `npm.cmd run test` - passed across shared, portal, customer, and rider suites.
- `npm.cmd run build` - passed.
- Backend API completion was separately committed in `d0a651b` after `docker compose run --rm api php artisan test` passed with 70 tests and 516 assertions.

### Known Warnings

- Customer Jest still emits a non-fatal React `act(...)` warning around `CustomerHomeScreen` query updates.
- Portal Vite production build still emits a chunk-size warning for the main bundle.

### Follow-Up Items

- Wrap the customer home query update path in test-safe `act(...)` coverage or adjust the test harness to await TanStack Query notifications cleanly.
- Consider code-splitting the portal app once feature work stabilizes.

## 2026-04-16

### Issues Found

- Customer mobile Arabic home-screen coverage used a broad text query that matched repeated copy after localization, making the suite fail before validating the screen state.
- Customer and rider mobile home screens displayed raw API enum values (`assigned`, `available`) inside localized Arabic UI instead of shared localized enum labels.
- Local API verification is blocked on this workstation because `apps/api/composer.json` requires PHP `^8.3`, while `php -v` reports PHP `8.2.12`.
- Portal Vitest startup is blocked locally by `esbuild` process spawn `EPERM`; lint still runs successfully.

### Fixes Implemented

- Updated the customer Arabic home-screen test to assert unique localized copy and the localized order status label.
- Added enum-label access to the customer mobile i18n provider and used it for the active order status.
- Added enum-label access to the rider mobile i18n provider and used it for availability titles and availability update feedback.
- Added a localized loading status string for customer active orders.

### Enhancements Implemented

- Improved customer and rider mobile localization consistency by keeping enum wire values out of user-facing status UI.
- Strengthened mobile regression coverage so Arabic UI tests catch raw enum regressions.

### Files Changed

- `apps/customer-app/__tests__/customer-app.test.js`
- `apps/customer-app/src/i18n.js`
- `apps/customer-app/src/screens/CustomerHomeScreen.js`
- `apps/rider-app/__tests__/rider-app.test.js`
- `apps/rider-app/src/i18n.js`
- `apps/rider-app/src/screens/RiderHomeScreen.js`
- `packages/shared/src/i18n/index.js`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- `npm.cmd --workspace @talabix/customer-app run test` - passed, 8 tests.
- `npm.cmd --workspace @talabix/rider-app run test` - passed, 6 tests.
- `node packages\shared\src\i18n\i18n.test.js` - passed, 4 tests.
- `npm.cmd run lint` - passed with one existing warning in `apps/portal-web/src/i18n-context.jsx`.

### Risks And Follow-Up Items

- Re-run API tests in a PHP 8.3+ environment.
- Investigate the portal Vitest `spawn EPERM` issue, likely local sandbox/process policy related.
- Consider localizing customer/rider notification fixture titles and next-action labels so Arabic home screens are fully localized end to end.

### Recommended Next Priorities

- Stabilize portal test execution so web UI changes can be validated in CI-like local runs.
- Continue tightening Arabic/English parity in mobile notification and delivery workflow labels.
- Review order and rider status transition screens for any remaining raw enum display.

## 2026-04-16 - Delivery enum label hardening

### Issues Found

- Customer live order tracking still rendered raw order status and timeline wire values such as `placed` and `order placed` when the app was opened in Arabic.
- Rider delivery proof capture and timeline cards exposed backend enum keys such as `recipient_confirmation`, `order placed`, and raw status transitions instead of localized shared labels.
- The shared `labelForEnum` helper returned missing translation keys like `enums.proofType.recipient_confirmation` instead of a humanized fallback when an enum group was not registered.
- Portal lint could only pass with warnings because the i18n context module exported both a component and hook, triggering the React Fast Refresh rule.

### Fixes Implemented

- Switched customer order tracking status and timeline rendering to shared localized enum labels.
- Switched rider delivery proof type buttons, selected proof mode, proof metadata, timeline event titles, and status transitions to shared enum labels.
- Added `proofType` enum labels in English and Arabic.
- Fixed `labelForEnum` fallback behavior so unknown backend enum values display as humanized labels instead of translation key paths.
- Split portal i18n into `i18n-provider.jsx`, `use-i18n.js`, and `i18n-store.js`, then updated imports to remove the Fast Refresh lint warning.

### Enhancements Implemented

- Added regression coverage that verifies Arabic customer tracking and rider delivery screens do not leak raw wire enum values.
- Added shared i18n coverage for proof type labels and unknown enum fallback behavior.
- Tightened lint quality by making `npm run lint -- --max-warnings=0` pass cleanly.

### Files Changed

- `apps/customer-app/__tests__/customer-app.test.js`
- `apps/customer-app/src/screens/OrderTrackingScreen.js`
- `apps/rider-app/__tests__/rider-app.test.js`
- `apps/rider-app/src/screens/DeliveryScreen.js`
- `packages/shared/src/i18n/index.js`
- `packages/shared/src/i18n/i18n.test.js`
- `apps/portal-web/src/App.jsx`
- `apps/portal-web/src/features/ops/OpsDashboardBoard.jsx`
- `apps/portal-web/src/i18n-provider.jsx`
- `apps/portal-web/src/i18n-store.js`
- `apps/portal-web/src/use-i18n.js`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- `npm.cmd --workspace @talabix/customer-app run test` - passed, 8 tests.
- `npm.cmd --workspace @talabix/rider-app run test` - passed, 7 tests.
- `node packages\shared\src\i18n\i18n.test.js` - passed, 4 tests.
- `npm.cmd run lint -- --max-warnings=0` - passed with no warnings.
- `npm.cmd --workspace @talabix/portal-web run test -- --run` - blocked before test execution by local `esbuild` process spawn `EPERM`.
- `php -v` - reports PHP `8.2.12`, still below the API requirement of PHP `^8.3`.

### Risks And Follow-Up Items

- Portal Vitest remains unverified in this workstation until the local `spawn EPERM` policy is resolved.
- API tests remain blocked locally until PHP 8.3+ is available.
- Several rider and customer secondary screens still have hardcoded English copy; continue converting high-traffic workflow labels incrementally.

### Recommended Next Priorities

- Resolve the local `esbuild`/Vitest `spawn EPERM` blocker or validate portal tests in CI.
- Continue localizing rider delivery action/feedback copy and customer tracking static copy.
- Review notification and support screens for raw `notification_type`, `actor_role`, and status labels.

## 2026-04-16 - Mobile notification enum label hardening

### Issues Found

- Customer and rider notification inbox cards still rendered raw notification type wire keys as manually humanized English pills (`order status updated`, `support note added`) when opened in Arabic.
- The shared i18n enum dictionary did not include notification types, notification delivery statuses, support case statuses, or timeline actor roles, forcing UI surfaces to invent labels locally.
- A broader dirty worktree from earlier daily automation work was present; this run only touched the notification-label slice and did not revert existing changes.

### Fixes Implemented

- Added shared English and Arabic enum labels for `notificationType`, `notificationDeliveryStatus`, `supportCaseStatus`, and `actorRole`.
- Replaced local notification-type humanizers in the customer and rider notification screens with the shared `labelForEnum` provider.
- Added regression coverage proving Arabic customer and rider inboxes show localized notification type labels and do not leak the old raw English strings.

### Enhancements Implemented

- Centralized more operational label formatting in `@talabix/shared/i18n`, reducing duplicate presentation logic across mobile surfaces.
- Strengthened notification UI localization consistency for both customer and rider apps.

### Files Changed

- `packages/shared/src/i18n/index.js`
- `packages/shared/src/i18n/i18n.test.js`
- `apps/customer-app/src/screens/CustomerNotificationsScreen.js`
- `apps/customer-app/__tests__/customer-app.test.js`
- `apps/rider-app/src/screens/RiderNotificationsScreen.js`
- `apps/rider-app/__tests__/rider-app.test.js`
- `docs/continuous-improvement-log.md`

### Migrations Added

- None.

### Validation Completed

- `node packages\shared\src\i18n\i18n.test.js` - passed, 4 tests.
- `npm.cmd --workspace @talabix/customer-app run test` - passed, 8 tests.
- `npm.cmd --workspace @talabix/rider-app run test` - passed, 7 tests.
- `npm.cmd run lint -- --max-warnings=0` - passed with no ESLint warnings.

### Risks And Follow-Up Items

- Portal notification and support console surfaces still contain manual status/role formatting; validate and migrate them once portal Vitest execution is available locally or in CI.
- Customer and rider notification screen chrome and feedback messages remain mostly English; continue localizing static inbox copy incrementally.
- API tests were not rerun in this slice because this change only touched shared/mobile JavaScript and the existing PHP 8.3 workstation blocker remains documented above.

### Recommended Next Priorities

- Localize customer and rider notification screen static labels, read-state pills, queued timestamp copy, and mark-read feedback.
- Migrate merchant inbox and ops support console status/type/actor labels to the shared enum label provider with portal tests when the Vitest `spawn EPERM` blocker is resolved.
- Continue scanning support, settlement, and dispatch boards for ad hoc `humanize` or raw enum rendering.
