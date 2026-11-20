"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  signupSchema,
  type AuthErrorKey,
  type SignupInput,
} from "@/modules/auth/auth.schemas";
import { FormField } from "../form-field/form-field";
import { useAuthForm, type FieldErrors } from "../use-auth-form/use-auth-form";
import styles from "./signup-form.module.css";

const FIELDS = ["name", "email", "password"] as const;
type Field = (typeof FIELDS)[number];

/** Hands the new account's email to /login (kept out of the URL). */
export const SIGNED_UP_EMAIL_KEY = "mm:signedUpEmail";

type ApiError = {
  error?: {
    code?: string;
    details?: { path?: string; message?: string }[];
  };
};

export function SignupForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { errors, handleSubmit, handleChange, showErrors } = useAuthForm(
    signupSchema,
    FIELDS,
  );
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);
  /** Set after a successful sign-up; reset when the page is hidden. */
  const submittedFormRef = useRef<HTMLFormElement | null>(null);

  // Move focus to a form-level error so keyboard and screen-reader users notice it.
  useEffect(() => {
    if (formError) formErrorRef.current?.focus();
  }, [formError]);

  // With cacheComponents, Next.js keeps visited pages alive (hidden) and shows
  // them again with the same state; effects are cleaned up when hidden. Reset
  // there after a successful sign-up, or going back to /signup would show
  // "Creating account…" with the old values filled in.
  useEffect(() => {
    return () => {
      const form = submittedFormRef.current;
      if (!form) return;
      submittedFormRef.current = null;
      form.reset();
      setPending(false);
    };
  }, []);

  const errorFor = (field: Field) => {
    const key = errors[field];
    return key ? t(`errors.${key}`) : undefined;
  };

  async function submit(data: SignupInput, form: HTMLFormElement) {
    setPending(true);
    setFormError(null);

    let response: Response;
    try {
      response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      setFormError(t("errors.generic"));
      setPending(false);
      return;
    }

    if (response.status === 201) {
      sessionStorage.setItem(SIGNED_UP_EMAIL_KEY, data.email);
      submittedFormRef.current = form;
      router.push("/login");
      return; // stay "pending" until the login page shows
    }

    // Switch on the error code, never on the message (API Design §2).
    const body = (await response.json().catch(() => null)) as ApiError | null;
    const code = body?.error?.code;

    if (code === "EMAIL_TAKEN") {
      showErrors(form, { email: "emailTaken" });
    } else if (code === "VALIDATION_FAILED") {
      const found: FieldErrors<Field> = {};
      for (const detail of body?.error?.details ?? []) {
        const field = FIELDS.find((name) => name === detail.path);
        const key = detail.message;
        if (field && key && t.has(`errors.${key}`)) {
          found[field] ??= key as AuthErrorKey;
        }
      }
      if (!showErrors(form, found)) setFormError(t("errors.generic"));
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
      noValidate
      className={styles.form}
      onChange={handleChange}
      onSubmit={handleSubmit(submit)}
    >
      <FormField
        id="signup-name"
        name="name"
        label={t("fields.name")}
        placeholder={t("fields.namePlaceholder")}
        autoComplete="name"
        required
        error={errorFor("name")}
      />
      <FormField
        id="signup-email"
        name="email"
        type="email"
        label={t("fields.email")}
        placeholder={t("fields.emailPlaceholder")}
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        hint={t("fields.emailNote")}
        error={errorFor("email")}
      />
      <FormField
        id="signup-password"
        name="password"
        type="password"
        label={t("fields.password")}
        placeholder={t("fields.newPasswordPlaceholder")}
        autoComplete="new-password"
        required
        hint={t("fields.passwordHint")}
        showPasswordLabel={t("fields.showPassword")}
        error={errorFor("password")}
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
        {pending ? t("signup.submitting") : t("signup.submit")}
        {!pending && (
          <ArrowRight aria-hidden="true" className={styles.submitIcon} />
        )}
      </Button>
    </form>
  );
}
