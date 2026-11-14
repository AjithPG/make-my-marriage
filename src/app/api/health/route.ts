import { connectDb } from "@/server/db";
import { handler, ok } from "@/server/http";

// Public uptime check (API Design §3.10): reports whether MongoDB answers a ping.
export const GET = handler({}, async () => {
  const started = Date.now();
  try {
    const { connection } = await connectDb();
    await connection.db?.admin().ping();
    return ok({ status: "ok", db: "up", dbLatencyMs: Date.now() - started });
  } catch (error) {
    console.error("Health check: database unreachable", error);
    return ok({ status: "degraded", db: "down" }, { status: 503 });
  }
});
