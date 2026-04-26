# Portal Web UI Kit

Vite/React merchant + ops portal recreation in HTML/React.

## Screens

- **Ops Dashboard** — KPI metrics, merchant ranking table, fleet snapshot
- **Dispatch Board** — rider assignment map, route cards with SLA tones
- **Merchant Orders** — kanban-style order board, accept/reject actions
- **Merchant Catalog** — searchable item list, status pills
- **Settlements** — payout ledger, commission breakdown

## Switching actors

Use the Merchant / Ops buttons at the bottom of the sidebar to toggle between actor views. Routes persist in localStorage.

## Design tokens (from `apps/portal-web/src/index.css`)

- Font: Space Grotesk (Google Fonts)
- Navy: `#112134`
- Orange (CTA): `#ff8c42`
- Teal (success): `#26a69a`
- Panel: `rgba(255,255,255,0.84)` + `backdrop-filter: blur(14px)`
- Shadow: `0 22px 45px rgba(17,33,52,0.10)`
- Transition: `160ms ease` throughout
- Border radius: 16–18px for panels/cards
