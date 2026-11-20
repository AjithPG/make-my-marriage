import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthFormColumn } from "@/components/auth/auth-form-column/auth-form-column";
import { AuthPanel } from "@/components/auth/auth-panel/auth-panel";
import { SignupForm } from "@/components/auth/signup-form/signup-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.signup");
  return { title: t("metaTitle") };
}

export default async function SignupPage() {
  const t = await getTranslations("Auth.signup");
  return (
    <>
      <AuthPanel variant="signup" />
      <AuthFormColumn
        title={t("title")}
        subtitle={t("subtitle")}
        switchPrompt={t("haveAccount")}
        switchLabel={t("logIn")}
        switchHref="/login"
      >
        <SignupForm />
      </AuthFormColumn>
    </>
  );
}
