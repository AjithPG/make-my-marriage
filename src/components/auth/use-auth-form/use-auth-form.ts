"use client";

import { useState, type FormEvent } from "react";
import type { z } from "zod";
import type { AuthErrorKey } from "@/modules/auth/auth.schemas";

export type FieldErrors<F extends string> = Partial<Record<F, AuthErrorKey>>;

/**
 * Validation for the auth forms with the shared Zod schema.
 * - Validates on submit; after the first submit, re-validates as the user types
 *   (which also clears errors that came from the server).
 * - Keeps the first error per field (a key into `Auth.errors`).
 * - On errors, moves focus to the first invalid field in form order.
 * - `showErrors()` puts server errors (e.g. `emailTaken`) under their fields.
 */
export function useAuthForm<S extends z.ZodObject, F extends string>(
  schema: S,
  fields: readonly F[],
) {
  const [errors, setErrors] = useState<FieldErrors<F>>({});
  const [submitted, setSubmitted] = useState(false);

  function validate(form: HTMLFormElement) {
    const data = new FormData(form);
    const values = Object.fromEntries(
      fields.map((field) => [field, String(data.get(field) ?? "")]),
    );
    const result = schema.safeParse(values);
    if (result.success) {
      return { data: result.data, errors: {} as FieldErrors<F> };
    }

    const found: FieldErrors<F> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as F;
      found[field] ??= issue.message as AuthErrorKey;
    }
    return { data: null, errors: found };
  }

  /** Shows `found` and focuses the first field that has an error. Returns false if there were none. */
  function showErrors(form: HTMLFormElement, found: FieldErrors<F>): boolean {
    setErrors(found);
    const firstInvalid = fields.find((field) => found[field]);
    if (!firstInvalid) return false;
    const input = form.elements.namedItem(firstInvalid);
    if (input instanceof HTMLInputElement) input.focus();
    return true;
  }

  function handleSubmit(
    onValid: (data: z.output<S>, form: HTMLFormElement) => void | Promise<void>,
  ) {
    return async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const { data, errors: found } = validate(form);
      setSubmitted(true);
      if (showErrors(form, found) || !data) return;
      await onValid(data, form);
    };
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    if (submitted) setErrors(validate(event.currentTarget).errors);
  }

  return { errors, handleSubmit, handleChange, showErrors };
}
