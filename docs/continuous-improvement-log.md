# Talabix Continuous Improvement Log

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
