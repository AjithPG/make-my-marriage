import { deleteSession } from "@/modules/auth/session";
import { clearSessionCookie, readSessionToken } from "@/server/auth/cookie";
import { handler, noContent } from "@/server/http";

// API Design §4.1: always 204, even without a session; the cookie is cleared with Max-Age=0.
export const POST = handler({}, async () => {
  const token = await readSessionToken();
  if (token) await deleteSession(token);
  await clearSessionCookie();
  return noContent();
});
