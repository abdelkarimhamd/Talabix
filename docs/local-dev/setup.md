# Local Development

## Prerequisites

- Docker Desktop
- Node.js 22+
- npm 11+

## First boot

1. `npm install`
2. `Copy-Item apps/api/.env.example apps/api/.env`
3. `Copy-Item .env.example .env`
4. `docker compose build`
5. `docker compose up -d mysql redis mailpit`
6. `docker compose run --rm api composer install --no-interaction --prefer-dist`
7. `docker compose run --rm api php artisan key:generate --force`
8. `docker compose run --rm api php artisan migrate --seed --force`
9. `docker compose up -d api worker scheduler reverb`

The root `.env` file controls host-exposed service ports. The default MySQL forward port is `33060`, while containers still communicate internally over `mysql:3306`.

## App URLs

- API: `http://localhost:8000`
- Reverb websocket: `ws://localhost:8080`
- Mailpit: `http://localhost:8025`

## Frontend and mobile

- Portal: `npm run dev:portal`
- Customer app: `npm run dev:customer`
- Rider app: `npm run dev:rider`
