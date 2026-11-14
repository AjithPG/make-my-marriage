import "server-only";
import { Resend } from "resend";
import { emailEnv } from "./env";

let client: Resend | undefined;

function resend(): Resend {
  client ??= new Resend(emailEnv().RESEND_API_KEY);
  return client;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends one transactional email (V1: password reset only).
 * Templates live with the feature that sends them. Returns the Resend message id.
 */
export async function sendEmail(message: EmailMessage): Promise<string> {
  const { data, error } = await resend().emails.send({
    from: emailEnv().EMAIL_FROM,
    ...message,
  });
  if (error || !data) {
    throw new Error(
      `Resend failed: ${error?.name ?? "unknown"} ${error?.message ?? ""}`,
    );
  }
  return data.id;
}
