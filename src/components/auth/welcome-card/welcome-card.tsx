import { getTranslations } from "next-intl/server";
import { LogoutButton } from "../logout-button/logout-button";
import styles from "./welcome-card.module.css";

type WelcomeCardProps = {
  name: string;
  email: string;
};

/** Shown after login: who is logged in, and a way to log out. */
export async function WelcomeCard({ name, email }: WelcomeCardProps) {
  const t = await getTranslations("Auth.welcome");
  return (
    <section className={styles.card} aria-labelledby="welcome-title">
      <div className={styles.intro}>
        <h1 id="welcome-title" className={styles.title}>
          {t("title", { name })}
        </h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </div>

      <dl className={styles.details}>
        <div className={styles.detail}>
          <dt className={styles.detailLabel}>{t("nameLabel")}</dt>
          <dd className={styles.detailValue}>{name}</dd>
        </div>
        <div className={styles.detail}>
          <dt className={styles.detailLabel}>{t("emailLabel")}</dt>
          <dd className={styles.detailValue}>{email}</dd>
        </div>
      </dl>

      <p className={styles.note}>{t("comingSoon")}</p>

      <LogoutButton />
    </section>
  );
}

/** Same size as the card while the session loads, so nothing jumps. */
export async function WelcomeCardSkeleton() {
  const t = await getTranslations("Auth.welcome");
  return (
    <div className={styles.card} role="status">
      <p className={styles.loading}>{t("loading")}</p>
    </div>
  );
}
