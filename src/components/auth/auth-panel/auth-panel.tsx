import { getTranslations } from "next-intl/server";
import { Check, Link2, MessageCircle } from "lucide-react";
import { BrandLogo } from "@/components/home/brand-logo/brand-logo";
import styles from "./auth-panel.module.css";

type AuthPanelProps = {
  variant: "signup" | "login";
};

const SIGNUP_POINTS = ["website", "whatsapp", "family"] as const;

/**
 * Wine brand panel. Desktop: left column with headline, preview cards and trust line.
 * Mobile: a header band with only the logo and headline.
 */
export async function AuthPanel({ variant }: AuthPanelProps) {
  const t = await getTranslations("Auth.panel");
  const tBrand = await getTranslations("Marketing");

  return (
    <header className={styles.panel}>
      <div className={styles.rings} aria-hidden="true">
        <span className={styles.ringTopLeft} />
        <span className={styles.ringRight} />
        <span className={styles.ringBottom} />
      </div>

      <div className={styles.top}>
        <BrandLogo name={tBrand("brand")} tone="inverse" />
        <p className={styles.headline}>{t(`${variant}.title`)}</p>

        {variant === "login" && (
          <p className={styles.subtitle}>{t("login.subtitle")}</p>
        )}
        {variant === "signup" && (
          <ul className={styles.points}>
            {SIGNUP_POINTS.map((point) => (
              <li key={point} className={styles.point}>
                <span className={styles.pointMark} aria-hidden="true">
                  <Check className={styles.pointIcon} />
                </span>
                {t(`signup.points.${point}`)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Decorative product previews (sample data). */}
      <div className={styles.previews} aria-hidden="true">
        {variant === "login" && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardEyebrow}>{t("invited.eyebrow")}</p>
                <p className={styles.cardTitle}>{t("invited.title")}</p>
              </div>
              <span className={styles.countPill}>{t("invited.count")}</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressBar} />
            </div>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDotFilled} />
                {t("invited.invited", { count: 142 })}
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDotEmpty} />
                {t("invited.notYet", { count: 68 })}
              </span>
            </div>
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.whatsappTitle}>
              <span className={styles.whatsappMark}>
                <MessageCircle className={styles.whatsappIcon} />
              </span>
              {t("whatsapp.title")}
            </span>
          </div>
          <p className={styles.quote}>{t("whatsapp.message")}</p>
          <div className={styles.cardFooter}>
            <span className={styles.siteLink}>
              <Link2 className={styles.siteLinkIcon} />
              {t("whatsapp.link")}
            </span>
            <span className={styles.sent}>{t("whatsapp.sent")}</span>
          </div>
        </div>
      </div>

      <p className={styles.trust}>{t("trust")}</p>
    </header>
  );
}
