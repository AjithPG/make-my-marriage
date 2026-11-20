import { signupSchema } from "@/modules/auth/auth.schemas";
import { signUp } from "@/modules/auth/signup";
import { clientIp, created, handler } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";

const HOUR_MS = 60 * 60 * 1000;

// API Design §3.1. Success: 201 { data: { id, name, email } }; the client then goes to /login.
export const POST = handler({ body: signupSchema }, async ({ req, body }) => {
  // 3 sign-ups per hour per IP (API Design §5).
  await rateLimit({
    key: `signup:ip:${clientIp(req)}`,
    limit: 3,
    windowMs: HOUR_MS,
  });
  return created(await signUp(body));
});
