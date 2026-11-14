// migrate-mongo configuration (Database Design §8).
// Runs outside Next.js, so it loads .env.local itself. Never run from the Vercel build.

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (e.g. env already set in the shell): use process.env as is.
}

const url = process.env.MIGRATE_MONGODB_URI;
if (!url) {
  throw new Error(
    "MIGRATE_MONGODB_URI is not set. Add it to .env.local (see .env.example).",
  );
}

// Database name comes from the URI path, e.g. ...mongodb.net/makemymarriage
const databaseName = new URL(
  url.replace(/^mongodb(\+srv)?:/, "http:"),
).pathname.slice(1);
if (!databaseName) {
  throw new Error(
    "MIGRATE_MONGODB_URI must include the database name in its path.",
  );
}

module.exports = {
  mongodb: { url, databaseName, options: {} },
  migrationsDir: "migrations",
  changelogCollectionName: "migrations",
  lockCollectionName: "migrationsLock",
  lockTtl: 300,
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: "commonjs",
};
