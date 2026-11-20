import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/home/brand-logo/brand-logo";
import styles from "./welcome-shell.module.css";

/** Centred frame for /welcome: logo on top, content card below. */
export async function WelcomeShell({ children }: { children: ReactNode }) {
  const t = await getTranslations("Marketing");
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <BrandLogo name={t("brand")} />
      </header>
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
