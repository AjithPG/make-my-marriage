import type { ReactNode } from "react";
import styles from "./auth-shell.module.css";

/** Two-column frame for the auth pages: wine panel + form column (stacked on mobile). */
export function AuthShell({ children }: { children: ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}
