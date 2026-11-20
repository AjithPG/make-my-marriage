"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./form-field.module.css";

type FormFieldProps = Omit<ComponentProps<"input">, "id" | "className"> & {
  id: string;
  label: string;
  /** Helper text under the field, linked with aria-describedby. */
  hint?: string;
  /** Already-translated error; marks the input invalid and is read with it. */
  error?: string;
  /** Shown at the end of the label row, e.g. "Forgot password?". */
  labelAction?: ReactNode;
  /** Required for type="password": label of the show/hide toggle. */
  showPasswordLabel?: string;
};

export function FormField({
  id,
  label,
  hint,
  error,
  labelAction,
  showPasswordLabel,
  type = "text",
  ...inputProps
}: FormFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  // Error first, so screen readers announce it before the hint.
  const describedBy =
    [error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <Label htmlFor={id} className={styles.label}>
          {label}
        </Label>
        {labelAction}
      </div>

      <div className={styles.control}>
        <Input
          id={id}
          type={isPassword && revealed ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={isPassword ? styles.inputWithToggle : styles.input}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.toggle}
            aria-label={showPasswordLabel}
            aria-pressed={revealed}
            aria-controls={id}
            onClick={() => setRevealed((value) => !value)}
          >
            {revealed ? (
              <EyeOff aria-hidden="true" className={styles.toggleIcon} />
            ) : (
              <Eye aria-hidden="true" className={styles.toggleIcon} />
            )}
          </button>
        )}
      </div>

      {error && (
        <p id={errorId} className={styles.error}>
          <CircleAlert aria-hidden="true" className={styles.errorIcon} />
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
