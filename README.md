# Make My Marriage

A free wedding website and planning app for Kerala weddings. One Next.js app (App Router) on
Vercel: pages, a REST API in route handlers, and a daily cron job, with MongoDB Atlas, Cloudflare
R2 and Resend.

- Product and design docs: [`docs/`](docs/)
- Architecture rules and conventions: [`CLAUDE.md`](CLAUDE.md)

## Prerequisites

- Node.js 22 (`.nvmrc`) and npm
- A MongoDB Atlas cluster in AWS `ap-south-1` (Mumbai). The free M0 tier is fine for development.
- Cloudflare R2 and Resend accounts (needed only when you work on uploads or email)

## Local setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a database in Atlas:
   - Cluster in `ap-south-1`. Database name `makemymarriage`.
   - Two database users: an **app** user (`readWrite` on `makemymarriage`) and a **migrate** user
     (`dbAdmin` + `readWrite` on `makemymarriage`).
   - Network access: add your current IP. Home IPs change often; update it when connections time out.

3. Copy the env template and fill it in:

   ```sh
   cp .env.example .env.local
   ```

   Only `APP_URL` and `MONGODB_URI` are needed to start. R2, Resend and cron variables are
   validated only when the code that uses them runs.

4. Create the indexes:

   ```sh
   npm run migrate
   npm run db:check-indexes   # every collection should print "ok"
   ```

5. Start the app:

   ```sh
   npm run dev
   ```

   Check http://localhost:3000/api/health. It should return `{"data":{"status":"ok","db":"up",...}}`.

## Scripts

| Script                                                | What it does                                |
| ----------------------------------------------------- | ------------------------------------------- |
| `npm run dev`                                         | Development server                          |
| `npm run build` / `npm start`                         | Production build / serve it                 |
| `npm run typecheck`                                   | Generate route types and run `tsc --noEmit` |
| `npm run format` / `format:check`                     | Prettier                                    |
| `npm run migrate` / `migrate:down` / `migrate:status` | migrate-mongo against `MIGRATE_MONGODB_URI` |
| `npm run migrate:create -- <name>`                    | New migration file in `migrations/`         |
| `npm run db:check-indexes`                            | Compare model indexes with the database     |

## Deploying to Vercel

1. Import the GitHub repository into Vercel (framework preset: Next.js, Node.js 22.x).
   `vercel.json` pins functions to `bom1` (Mumbai) and schedules the cleanup cron.
2. Set environment variables per environment (Development, Preview, Production), using separate
   Atlas clusters/users and R2 buckets for Preview and Production:
   `APP_URL`, `MONGODB_URI`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_BUCKET`, `R2_PUBLIC_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`.
   Do **not** set `MIGRATE_MONGODB_URI` on Vercel.
3. Atlas network access for Preview and Production must allow `0.0.0.0/0` (Vercel functions have
   no fixed IPs). Security relies on a strong app-only database user over TLS.
4. Run `npm run migrate` against the target database **before** merging to `main`. Migrations never
   run in the Vercel build.

### Cron

`/api/cron/cleanup` runs daily at 21:30 UTC (03:00 IST), on production deployments only. Vercel
sends `Authorization: Bearer $CRON_SECRET`. To trigger it by hand:

```sh
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/cleanup
```

On the Hobby plan, cron runs at most once a day and may fire any time within the scheduled hour.

### R2

- One bucket per environment, with an API token scoped to that bucket.
- A custom (or `r2.dev`) public domain for processed media, set as `R2_PUBLIC_URL`.
- A CORS rule allowing `PUT` with the `Content-Type` header from the app's origins.
- A lifecycle rule on `originals/` (delete after 1 day) as a backup for the cleanup job.
