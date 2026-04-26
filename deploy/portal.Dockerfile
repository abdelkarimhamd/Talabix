FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/customer-app/package.json apps/customer-app/package.json
COPY apps/portal-web/package.json apps/portal-web/package.json
COPY apps/rider-app/package.json apps/rider-app/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY apps/portal-web apps/portal-web
COPY packages/shared packages/shared

RUN npm --workspace @talabix/portal-web run build

FROM nginx:1.27-alpine

COPY deploy/nginx/portal.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/portal-web/dist /usr/share/nginx/html
