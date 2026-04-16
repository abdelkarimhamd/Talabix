# ADR 0001: Laravel Modular Monolith

## Status

Accepted

## Decision

Talabix will ship v1 as a Laravel 13 modular monolith. Orders, dispatch, tracking, and settlements remain in one transactional boundary, while domain events are used for timeline projection, notifications, and realtime fan-out.

## Consequences

- Data consistency stays simple for multi-step order transitions.
- Client APIs stay versioned under `/api/v1` with actor route partitions instead of service-specific gateways.
- We avoid microservice overhead, CQRS, and event-sourcing complexity in v1.
- Domain modules remain lightweight and Laravel-native rather than introducing a modular framework package.
