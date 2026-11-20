import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { WelcomeShell } from "@/components/auth/welcome-shell/welcome-shell";
import {
  WelcomeCard,
  WelcomeCardSkeleton,
} from "@/components/auth/welcome-card/welcome-card";
import { getSession } from "@/modules/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.welcome");
  return { title: t("metaTitle"), robots: { index: false } };
}

// The shell is static; only the part that reads the session cookie runs per
// request, inside <Suspense> (required with cacheComponents).
export default function WelcomePage() {
  return (
    <WelcomeShell>
      <Suspense fallback={<WelcomeCardSkeleton />}>
        <CurrentUser />
      </Suspense>
    </WelcomeShell>
  );
}

async function CurrentUser() {
  // getSession() compares the session's expiry with the current time;
  // connection() keeps that out of prerendering (it runs per request only).
  await connection();
  const session = await getSession();
  if (!session) redirect("/login");
  return <WelcomeCard name={session.user.name} email={session.user.email} />;
}
