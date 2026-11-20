import { loginSchema } from "@/modules/auth/auth.schemas";
import { login } from "@/modules/auth/login";
import { readSessionToken, setSessionCookie } from "@/server/auth/cookie";
import { clientIp, handler, ok } from "@/server/http";

// API Design §3.1. Success: 200 { data: { id, name, email } } + Set-Cookie mm_session.
export const POST = handler({ body: loginSchema }, async ({ req, body }) => {
  const { user, session } = await login(body, {
    ip: clientIp(req),
    currentToken: await readSessionToken(),
  });
  await setSessionCookie(session.token, session.expiresAt);
  return ok(user);
});
