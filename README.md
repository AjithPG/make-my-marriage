# Make My Marriage

A free wedding website and planning app for Kerala weddings. One Next.js app (App Router) with
MongoDB Atlas. Right now it has the landing page and a database health check; everything else is
added feature by feature.

- Product and design docs: [`docs/`](docs/)
- Architecture rules and conventions: [`CLAUDE.md`](CLAUDE.md)

## Prerequisites

- Node.js 22 (`.nvmrc`) and npm
- A MongoDB Atlas cluster in AWS `ap-south-1` (Mumbai). The free M0 tier is fine for development.

## Local setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a database in Atlas:
   - Cluster in `ap-south-1`. Database name `makemymarriage`.
   - An **app** database user with `readWrite` on `makemymarriage`.
   - Network access: add your current IP. Home IPs change often; update it when connections time out.

3. Copy the env template and fill it in:

   ```sh
   cp .env.example .env.local
   ```

   It needs `APP_URL` and `MONGODB_URI`.

4. Start the app:

   ```sh
   npm run dev
   ```

   Check http://localhost:3000/api/health. It should return `{"data":{"status":"ok","db":"up",...}}`.

## Scripts

| Script                            | What it does                                |
| --------------------------------- | ------------------------------------------- |
| `npm run dev`                     | Development server                          |
| `npm run build` / `npm start`     | Production build / serve it                 |
| `npm run typecheck`               | Generate route types and run `tsc --noEmit` |
| `npm run format` / `format:check` | Prettier                                    |
