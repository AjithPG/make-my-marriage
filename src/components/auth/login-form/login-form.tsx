"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, CircleAlert, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginInput } from "@/modules/auth/auth.schemas";
import { FormField } from "../form-field/form-field";
import { SIGNED_UP_EMAIL_KEY } from "../signup-form/signup-form";
import { useAuthForm } from "../use-auth-form/use-auth-form";
import styles from "./login-form.module.css";

const FIELDS = ["email", "password"] as const;

type ApiError = { error?: { code?: string } };

export function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { errors, handleSubmit, handleChange } = useAuthForm(
    loginSchema,
    FIELDS,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [signedUp, setSignedUp] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);
  const loggedInRef = useRef(false);

  // Move focus to a form-level error so keyboard and screen-reader users notice it.
  useEffect(() => {
    if (formError) formErrorRef.current?.focus();
  }, [formError]);

  // With cacheComponents, Next.js keeps visited pages alive (hidden) and shows
  // them again with the same state; effects are cleaned up when hidden. Reset
  // there after a successful login, or /login would come back (e.g. after
  // logout) still "Logging in…" with the password filled in.
  useEffect(() => {
    const form = formRef.current;
    return () => {
      if (!loggedInRef.current) return;
      loggedInRef.current = false;
      form?.reset();
      setPending(false);
    };
  }, []);

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

  async function submit(data: LoginInput) {
    setPending(true);
    setFormError(null);
    setSignedUp(false);

    let response: Response;
    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      setFormError(t("errors.generic"));
      setPending(false);
      return;
    }

    if (response.ok) {
      // The server set the mm_session cookie.
      loggedInRef.current = true;
      router.push("/welcome");
      return; // stay "pending" until the next page shows
    }

    // Switch on the error code, never on the message (API Design §2).
    const body = (await response.json().catch(() => null)) as ApiError | null;
    const code = body?.error?.code;

    if (code === "INVALID_CREDENTIALS") {
      setFormError(t("errors.invalidCredentials"));
    } else if (code === "RATE_LIMITED") {
      const seconds = Number(response.headers.get("Retry-After")) || 60;
      setFormError(
        t("errors.tooManyAttempts", { minutes: Math.ceil(seconds / 60) }),
      );
    } else {
      setFormError(t("errors.generic"));
    }
    setPending(false);
  }

  return (
    <form
      ref={formRef}
      noValidate
      className={styles.form}
      onChange={handleChange}
      onSubmit={handleSubmit(submit)}
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

      {formError && (
        <p
          ref={formErrorRef}
          role="alert"
          tabIndex={-1}
          className={styles.formError}
        >
          <CircleAlert aria-hidden="true" className={styles.formErrorIcon} />
          {formError}
        </p>
      )}

      <Button type="submit" disabled={pending} className={styles.submit}>
        {pending ? t("login.submitting") : t("login.submit")}
        {!pending && (
          <ArrowRight aria-hidden="true" className={styles.submitIcon} />
        )}
      </Button>
    </form>
  );
}
