# API Conventions

- All public endpoints live under `/api/v1`.
- Actor partitions are fixed as `/customer`, `/merchant`, `/rider`, and `/ops`.
- Bearer tokens are issued by Sanctum and scoped by abilities, not only by role.
- Laravel Form Requests are authoritative for validation; web and mobile clients mirror critical payloads with runtime validators from `@talabix/shared`.
- API resources return stable top-level shapes. Collections return `data`; mutations return `data` plus optional `meta`.
- Public-facing resource identifiers use UUID route keys even when internal tables keep numeric primary keys.
- Order state changes are only allowed through `OrderLifecycleService`.
- Regenerate Scribe after API response/request changes and keep the committed contract at `docs/api/openapi.yaml`.
