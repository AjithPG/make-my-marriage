"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginSchema } from "@/modules/auth/auth.schemas";
import { FormField } from "../form-field/form-field";
import { SIGNED_UP_EMAIL_KEY } from "../signup-form/signup-form";
import { useAuthForm } from "../use-auth-form/use-auth-form";
import styles from "./login-form.module.css";

const FIELDS = ["email", "password"] as const;

export function LoginForm() {
  const t = useTranslations("Auth");
  const { errors, handleSubmit, handleChange } = useAuthForm(
    loginSchema,
    FIELDS,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [signedUp, setSignedUp] = useState(false);

  // Coming from a successful sign-up: say so, fill in the email, focus the password.
  useEffect(() => {
    const email = sessionStorage.getItem(SIGNED_UP_EMAIL_KEY);
    if (!email) return;
    sessionStorage.removeItem(SIGNED_UP_EMAIL_KEY);
    setSignedUp(true);
    const form = formRef.current;
    const emailInput = form?.elements.namedItem("email");
    const passwordInput = form?.elements.namedItem("password");
    if (emailInput instanceof HTMLInputElement) emailInput.value = email;
    if (passwordInput instanceof HTMLInputElement) passwordInput.focus();
  }, []);

  const errorFor = (field: (typeof FIELDS)[number]) => {
    const key = errors[field];
    return key ? t(`errors.${key}`) : undefined;
  };

  return (
    <form
      ref={formRef}
      noValidate
      className={styles.form}
      onChange={handleChange}
      // Not connected to the API yet (Step 9 adds the fetch to /api/auth/login).
      onSubmit={handleSubmit(() => {})}
    >
      {/* Always in the DOM so screen readers announce the message when it appears. */}
      <div role="status" className={styles.status}>
        {signedUp && (
          <p className={styles.notice}>
            <CircleCheck aria-hidden="true" className={styles.noticeIcon} />
            {t("login.signedUp")}
          </p>
        )}
      </div>

      <FormField
        id="login-email"
        name="email"
        type="email"
        label={t("fields.email")}
        placeholder={t("fields.emailPlaceholder")}
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        error={errorFor("email")}
      />
      <FormField
        id="login-password"
        name="password"
        type="password"
        label={t("fields.password")}
        autoComplete="current-password"
        required
        showPasswordLabel={t("fields.showPassword")}
        error={errorFor("password")}
        labelAction={
          // The forgot-password page arrives in Step 8.
          <a href="#" className={styles.forgotLink}>
            {t("login.forgotPassword")}
          </a>
        }
      />

      <Button type="submit" className={styles.submit}>
        {t("login.submit")}
        <ArrowRight aria-hidden="true" className={styles.submitIcon} />
      </Button>
    </form>
  );
}
