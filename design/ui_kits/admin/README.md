# Store Management + Admin + Super Admin UI Kit

Three distinct role experiences in one portal — a store manager running a merchant, an ops admin overseeing the platform, and a super admin governing tenants/flags/identity.

Switch roles via the **Store / Admin / Super** toggle in the topbar.

## How access works (RBAC)

```
customer      → orders.place, orders.view_own, catalog.read
store_cashier → + orders.accept, orders.view_own (branch-scoped)
store_manager → + catalog.write, payouts.view, reports.read (store-scoped)
ops_admin     → + orders.refund, payouts.process, dispatch.manage, audit.read (region-scoped)
super_admin   → + tenant.suspend, flags.toggle, system.access, roles.grant (global)
```

Capabilities are enforced server-side via Laravel policies (`@talabix/shared` ability maps). The UI shows/hides routes and CTAs based on the user's merged ability set from their role + tenant scope.

## Screens

**Store Manager**

- Dashboard — KPIs, live pipeline, top items, team on duty
- Live Orders — kanban of New → Preparing → Ready → With rider
- Menu & Catalog — item grid with stock status, category tabs
- Branches — branch cards with live status
- Promotions, Team, Reports, Payouts, Settings (scaffolded)

**Ops Admin**

- Platform Overview — GMV, fleet map, SLA breakdown, incidents, top merchants
- Live Dispatch — active rider cards with SLA tones
- Merchants — searchable list with GMV + status
- Finance & Ledger — payout batches, commission breakdown
- Riders, Customers, Campaigns, Analytics (scaffolded)

**Super Admin**

- Company HQ — system health grid, feature flags, audit stream
- Roles & Access — full RBAC matrix, active admins, tenants
- Tenants, Feature Flags, Audit Log, System Health (scaffolded)

## Design language

- **Font** — Space Grotesk (UI) + IBM Plex Mono (codes, flag names, role keys)
- **Navy `#112134`** — ink, headings, sidebar brand
- **Orange `#ff8c42`** — primary CTAs (gradient), active nav accent
- **Yellow `#FFCC00`** — brand mark (the T logo square)
- **Teal `#26a69a`** — success / drop-off accents
- **Green `#22A45D`** — up-trends, success pills
- **Red `#E53935`** — critical alerts, danger actions
- **Amber `#F59E0B`** — warnings
- **Panels** — white with 1px navy/8% border, radius 16
- **Tables** — 12px uppercase column heads, 1px row dividers, tabular-nums for figures

Active nav item gets a 3px orange left-border + soft orange/yellow gradient background. Role switcher uses an iOS-style segmented control in the topbar.
