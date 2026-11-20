import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthFormColumn } from "@/components/auth/auth-form-column/auth-form-column";
import { AuthPanel } from "@/components/auth/auth-panel/auth-panel";
import { LoginForm } from "@/components/auth/login-form/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.login");
  return { title: t("metaTitle") };
}

export default async function LoginPage() {
  const t = await getTranslations("Auth.login");
  return (
    <>
      <AuthPanel variant="login" />
      <AuthFormColumn
        title={t("title")}
        subtitle={t("subtitle")}
        switchPrompt={t("newHere")}
        switchLabel={t("createWedding")}
        switchHref="/signup"
      >
        <LoginForm />
      </AuthFormColumn>
    </>
  );
}
