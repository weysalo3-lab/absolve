# Kiray

House rentals and neighbourhood services for Ethiopia, in English and Amharic.
Next.js 15 (App Router) running on Cloudflare Workers with D1 (SQLite) and R2,
with a zero-config local fallback to `node:sqlite` and disk storage.

## Features

- **Homes**: search with filters and map bounds, listing pages with photo gallery,
  neighbourhood ring (walk to the nearest shop, pharmacy, transport, school, clinic)
- **Bookings**: monthly or nightly requests, instant book, accept / decline / cancel,
  automatic completion, reviews with sub-scores and host replies
- **Hosting**: dashboard with stats, listing editor with photo upload, publish / pause
- **Services directory**: categories, open-now / delivery / 24/7 filters, text search,
  business detail pages with hours, contact and ratings
- **Businesses**: anyone can submit a business at `/host/services/new`; an admin publishes it
- **Messaging** between renters and owners, with unread counts
- **Notifications** for booking requests, answers, cancellations and business approval
- **Admin**: platform stats, listing and service moderation, verified badges

## Requirements

- Node.js **22.5+** (uses the built-in `node:sqlite` for local development)
- A Cloudflare account only if you deploy

## Getting started

```bash
npm install
npm run setup     # creates data/kiray.sqlite, applies the schema, seeds demo data
npm run dev       # http://localhost:3000
```

`npm run db:reset` wipes the local database and photo store.

### Demo accounts (password in brackets)

| Role  | Phone          | Password      |
| ----- | -------------- | ------------- |
| Host  | 0911 223 344   | `password123` |
| Host  | 0922 334 455   | `password123` |
| Guest | 0933 445 566   | `password123` |
| Admin | 0900 000 000   | `admin123`    |

Change or remove these before going to production.

## Scripts

| Script                      | What it does                                          |
| --------------------------- | ----------------------------------------------------- |
| `npm run dev`               | Next.js dev server (local SQLite unless bindings exist) |
| `npm run build`             | Production build                                      |
| `npm run typecheck`         | `tsc --noEmit`                                        |
| `npm run db:migrate`        | Apply D1 migrations locally via wrangler              |
| `npm run db:migrate:remote` | Apply D1 migrations to the remote database            |
| `npm run preview`           | Build with OpenNext and preview in the Workers runtime |
| `npm run deploy`            | Build and deploy to Cloudflare                        |

## Deploying to Cloudflare

1. `npx wrangler d1 create kiray-db` and put the id into `wrangler.jsonc`.
2. `npx wrangler r2 bucket create kiray-photos`.
3. `npm run db:migrate:remote`.
4. `npm run deploy`.

## Project layout

```
migrations/          D1 schema
scripts/             local setup and reset
src/actions/         server actions (all validation happens here)
src/app/[locale]/    pages, one tree per language (/en, /am)
src/app/api/         image streaming and placeholder SVGs
src/components/      shared UI; primitives in components/ui
src/lib/db/          queries, one module per table group
src/lib/i18n/        bilingual dictionary and helpers
```

## CI

`.gitlab-ci.yml` installs dependencies, runs the type check (non-blocking) and
builds the app on every merge request and branch push.
