import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import styles from "./auth-form-column.module.css";

type AuthFormColumnProps = {
  title: string;
  subtitle: string;
  /** e.g. "Already have an account?" */
  switchPrompt: string;
  /** e.g. "Log in" */
  switchLabel: string;
  switchHref: "/login" | "/signup";
  children: ReactNode;
};

/** Right column (below the band on mobile): page title, form, link to the other page, footer. */
export async function AuthFormColumn({
  title,
  subtitle,
  switchPrompt,
  switchLabel,
  switchHref,
  children,
}: AuthFormColumnProps) {
  const t = await getTranslations();

  return (
    <div className={styles.column}>
      <main id="main" className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        {children}

        <p className={styles.switch}>
          {switchPrompt}{" "}
          <Link href={switchHref} className={styles.switchLink}>
            {switchLabel}
          </Link>
        </p>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerTrust}>{t("Auth.panel.trust")}</p>
        <p>{t("Marketing.footer.copyright", { year: 2026 })}</p>
      </footer>
    </div>
  );
}
