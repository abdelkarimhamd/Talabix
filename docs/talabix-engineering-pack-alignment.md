# Talabix Engineering Pack Alignment

## Purpose

This note translates `Talabix_Full_BRD_PRD_Engineering_Pack.docx` into the exact scope we should treat as Talabix v1 for this repository.

The Word document is broader than the current Talabix implementation plan. It mixes:

- true MVP requirements,
- post-MVP growth features,
- alternative implementation choices,
- and some platform assumptions that conflict with the repo we intentionally built.

For this repo, the source of truth for v1 should be:

1. the implemented Talabix monorepo structure,
2. the Laravel modular-monolith API plan,
3. the current Docker/local-dev/runtime decisions,
4. and the MVP assumptions already locked into the codebase.

## Exact Talabix v1 Scope

These are the document requirements we should treat as in-scope for this repo now.

### Platform shape

- One Laravel 13 backend serving all actors.
- One shared React portal with strict route partitions for merchant and ops users.
- One Expo customer app.
- One Expo rider app.
- MySQL as source of truth, Redis for cache/queue, Reverb for realtime, Horizon for workers.
- Sanctum bearer tokens plus RBAC and policy checks.

### Core actor flows

- Customer login, address book, merchant discovery, catalog browsing, checkout, order tracking, and order history.
- Merchant order board, catalog maintenance, branch management basics, and order acceptance flow.
- Rider login, availability toggle, assignment visibility, pickup, and delivery completion.
- Ops merchant management, dispatch reassignment, order oversight, support notes/cancel actions, and settlement visibility.

### Core domain rules

- One order belongs to one merchant.
- Coverage must be validated by branch/service zone rules.
- Order state transitions must be centralized and auditable.
- Dispatch must support auto-assignment plus manual reassignment.
- Settlement data must be ledger-based and generated per order.
- Sensitive ops/support actions must produce audit records.

### Delivery readiness

- API contract generation.
- Automated backend tests.
- Portal and mobile smoke-level tests.
- CI for backend and JS workspaces.
- Docker-based local infrastructure.

## Intentional v1 Decisions That Override The Document

The document is useful, but these repo decisions are intentional and should not be treated as gaps.

### Authentication

- Repo v1 uses email/password for customers, riders, merchant users, and ops users.
- The document repeatedly asks for OTP registration/recovery.
- OTP should be treated as a later enhancement unless product explicitly changes the v1 decision.

### Payments

- Repo v1 is COD-first.
- The document includes online payment integration and refunds.
- Online payments and refund automation are not current MVP scope.

### Merchant onboarding

- Repo v1 uses admin-created merchants.
- The document includes merchant self-application, legal docs, and approval workflows.
- Merchant self-serve onboarding should be deferred unless the product decision changes.

### Portal structure

- Repo v1 intentionally uses one React portal with `/merchant/*` and `/ops/*`.
- The document suggests separate admin and merchant web apps.
- We should keep one shared portal unless scale or team structure forces a split later.

### Dispatch sophistication

- Repo v1 uses simple scoring and manual override.
- The document mentions richer live operations expectations.
- AI optimization, advanced routing, batching, and deep SLA automation remain out of scope.

## What The Document Adds That We Still Need For MVP

These items are compatible with the repo direction and should still be built.

### Identity and access

- Profile editing flows for rider, merchant user, and ops user.
- Explicit approval/status flows for controlled user types.
- Broader auth abuse protection beyond the current customer-side throttling.

### Address and serviceability

- Production maps provider credentials, provider dashboard alerts, and provider-failure UX evidence.

### Customer experience

- Product detail completeness beyond the current merchant/store detail and catalog preview flow.
- Ratings and post-order feedback.
- In-app support entry points.

### Merchant experience

- Branch management UI beyond the current shell.
- Better order SLA handling, reject reasons, and prep-stage controls.
- Merchant reporting basics.

### Rider experience

- Approval/document workflows, plus richer post-exception support resolution paths.

### Ops and support

- Merchant approval workflow if onboarding mode changes.
- Rider approval and document review.
- Refund review workflows only if online payment/refund scope is expanded.

### Notifications

- OTP messaging.

### DevOps and operations

- Staging and production environment definitions.
- Secrets management strategy.
- Monitoring, logs, metrics, alerts, backups, and rollback runbooks.

## What The Document Contains That Should Be Deferred

These items are valid product ideas, but they should not be treated as immediate Talabix v1 requirements.

- OTP-first auth.
- Online payment gateway integration.
- Refund automation.
- Coupons and promotions.
- Merchant subscriptions.
- Sponsored listings.
- Loyalty and wallet.
- Advanced reporting and analytics warehouse work.
- AI dispatch optimization.
- Multi-country tax engine.
- Corporate billing.
- Broader retail vertical support.

## Current Repo Status Against The Document

### EPIC 1 - Platform Foundation & Access Control

- Status: largely established for MVP.
- Done: monorepo, Docker local stack, Laravel auth/login, customer registration, Sanctum, permissions, audit logging base, customer auth throttling, CI, and shared portal route guards.
- Missing: OTP, broader cross-actor auth hardening, and fuller frontend auth flows for non-customer actors.

### EPIC 2 - Customer Identity & Profile Management

- Status: largely established for MVP.
- Done: login/logout, password reset flows, registration, editable customer profile, richer addresses, order history endpoints, and customer app profile/register screens.
- Missing: richer customer profile UX beyond the current MVP fields.

### EPIC 3 - Address, Maps & Serviceability

- Status: largely established for MVP.
- Done: address CRUD, structured address notes/fields, default address handling, map-driven place search, customer current-location permission handling, address-aware discovery, service-zone validation at checkout, and shared maps-provider ETA projection.
- Missing: live maps-provider credentials, provider dashboard alerts, and production maps-provider failure evidence.

### EPIC 4 - Customer Discovery & Store Experience

- Status: largely established for MVP.
- Done: merchant listing, search, open-now filter, address-aware serviceability filtering, merchant detail, branch catalog endpoint, and customer mobile discovery flow.
- Missing: featured content, richer product detail, ratings, and merchandising polish.

### EPIC 5 - Cart & Checkout

- Status: partial.
- Done: checkout validation, order creation pipeline, customer app cart flow, COD checkout handoff, and order tracking continuation.
- Missing: persistent cart API, coupon hooks with actual rules, and delivery slot UX.

### EPIC 6 - Payment Integration

- Status: intentionally deferred.
- Current repo uses COD-focused order/payment state handling only.

### EPIC 7 - Order Management Core

- Status: largely established for MVP.
- Done: order snapshots, timeline, lifecycle service, invalid transition protection, checkout/order tests.
- Missing: broader cancellation matrix, richer timeline exposure in clients.

### EPIC 8 - Merchant Onboarding & Branch Management

- Status: partial.
- Done: merchants, branches, hours, zones, fee bands, admin-side merchant creation.
- Missing: self-application, approvals UI, legal docs, bank detail workflows.

### EPIC 9 - Merchant Menu & Availability Management

- Status: largely established for MVP.
- Done: merchant-owned catalog, branch overrides, merchant catalog CRUD endpoints, portal catalog management UI, categories, image URLs, item-specific modifier groups/options, and modifier-aware customer catalog/checkout snapshots.
- Missing: reusable variants and richer availability controls.

### EPIC 10 - Merchant Order Fulfillment

- Status: largely established for MVP.
- Done: merchant order board UI, accept/reject endpoints, preparing and ready-for-pickup transitions, order retrieval, and merchant fulfillment tests.
- Missing: reject reasons/reportability.

### EPIC 11 - Rider Onboarding & Availability

- Status: partial.
- Done: rider role/profile seed data and availability updates.
- Missing: onboarding, approvals, document handling.

### EPIC 12 - Rider Delivery Operations

- Status: largely established for MVP.
- Done: assignment visibility, assignment acceptance, pickup, proof-of-delivery capture, delivered transition, navigation handoff, rider delivery exception reporting with response SLA visibility, rider earnings summary/reporting, and rider app execution flow.
- Missing: richer post-exception support resolution paths and rider approval/document handling.

### EPIC 13 - Dispatch & Live Operations

- Status: partial.
- Done: dispatch board, ops map view, route/ETA projections for active assignments, auto-assignment scoring, manual reassignment, delivery exception response SLA visibility, and audit/timeline verification.
- Missing: monitoring alerts for breached SLA windows and deeper realtime ops tooling.

### EPIC 14 - Admin Configuration & Master Data

- Status: partial.
- Done: ops configuration API and portal UI for merchant commission, branch order-taking, service zones, and fee bands.
- Missing: admin UI and APIs for cities, taxes, feature flags, and broader master data.

### EPIC 15 - Support, Cancellation & Refund Management

- Status: largely established for MVP.
- Done: support search, support case/ticket shape, structured issue types, structured cancellation reason codes, richer support outcomes/resolution types, support notes, cancel action, notification visibility, and audit/test coverage for sensitive support actions.
- Missing: refund workflows only if online payments/refunds become in-scope.

### EPIC 16 - Notifications & Communication

- Status: partial.
- Done: event/listener/job structure, durable notification delivery records, provider routing, retry handling, Scribe-visible ops notification endpoints, actor-scoped in-app inbox/read flows for customer, rider, and merchant, plus actor-specific order/support template copy and SMS delivery support for critical customer order updates.
- Missing: OTP messaging.

### EPIC 17 - Reporting & Analytics

- Status: partial.
- Done: settlement ledger, export basics, manual adjustment flow, merchant sales reporting, rider earnings reporting, and ops KPI dashboard views.
- Missing: deeper analytics slicing, warehouse/reporting infrastructure, and historical BI-style reporting.

### EPIC 18 - Security, Audit & Compliance

- Status: partial.
- Done: audit model, audit log schema, ability-based access, policy structure, and customer auth throttling.
- Missing: broader abuse controls, explicit cross-actor rate limiting strategy, and production security hardening.

### EPIC 19 - DevOps, Monitoring & Release Engineering

- Status: partial.
- Done: Docker local infra, CI, backend/frontend test/build loop, production readiness runbook, Docker VM deployment target, GitHub Actions deploy workflow, readiness endpoint contract, and a repo launch preflight command for evidence/runtime gates.
- Missing: live environment provisioning, alert wiring, first restore-drill evidence, and incident drill evidence.

## Exact Next Build Backlog

If we continue from the current repo and stay aligned with both the document and the repo MVP plan, the next work should be:

1. Provision the staging VM, add GitHub Environment secrets, and run the deploy workflow end to end.
2. Select monitoring tools and wire alerts for readiness, queue depth, failed jobs, Reverb, database, Redis, maps, and notification delivery.
3. Run the first staging MySQL restore drill and attach evidence to `docs/ops/launch-evidence.md`.
4. Complete maps production hardening with live provider credentials, provider dashboard alerts, and a staging fallback alert drill.
5. Wire alerting for breached dispatch and delivery-exception SLA windows, then run an ops drill and attach evidence to `docs/ops/launch-evidence.md`.
6. Run `npm run launch:preflight` after the staging evidence rows are updated, then resolve any reported evidence or runtime blockers before production traffic.
7. If auth scope changes beyond the current repo MVP, add OTP messaging separately as an explicit scope expansion.

## Recommended Rule For Future Planning

When this Word document and the repo diverge, use this decision order:

1. Current Talabix repo MVP assumptions.
2. Current implemented architecture decisions.
3. The Word document as a broader requirements source.

That keeps us from accidentally expanding v1 with OTP, online payments, refunds, coupons, or separate web apps unless we choose to do so explicitly.
