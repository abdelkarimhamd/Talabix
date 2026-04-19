# Talabix Continuous Improvement Log

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
