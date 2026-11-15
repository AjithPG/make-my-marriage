import { getTranslations } from "next-intl/server";
import { MapPin, MessageCircle, Play } from "lucide-react";
import styles from "./hero-preview.module.css";

/**
 * Decorative phone mockup of a sample wedding site. Hidden from screen
 * readers (the hero text already says what the product does), so it must
 * not contain links, buttons or headings.
 */
export async function HeroPreview() {
  const t = await getTranslations("Landing.preview");

  return (
    <div className={styles.preview} aria-hidden="true">
      <div className={styles.glow} />

      <div className={styles.invitedCard}>
        <div className={styles.invitedHeader}>
          <span className={styles.invitedLabel}>
            <span className={styles.liveDot} />
            {t("invitedLabel")}
          </span>
          <span className={styles.invitedPercent}>68%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} />
        </div>
        <p className={styles.invitedCount}>{t("invitedCount")}</p>
      </div>

      <div className={styles.phone}>
        <div className={styles.phoneNotch} />
        <div className={styles.phoneScreen}>
          <div className={styles.siteHeader}>
            <div className={styles.monogram}>{t("monogram")}</div>
            <p className={styles.coupleName}>{t("couple")}</p>
            <p className={styles.dateLine}>{t("dateLine")}</p>
            <p className={styles.urlChip}>{t("url")}</p>
          </div>

          <div className={styles.eventList}>
            <div className={styles.eventCard}>
              <p className={styles.eventName}>{t("engagement")}</p>
              <p className={styles.eventMeta}>{t("engagementMeta")}</p>
            </div>

            <div className={styles.eventCardHighlight}>
              <p className={styles.eventNameHighlight}>{t("muhurtham")}</p>
              <p className={styles.eventTime}>{t("muhurthamTime")}</p>
              <p className={styles.eventMeta}>{t("muhurthamVenue")}</p>
              <div className={styles.eventActions}>
                <span className={styles.watchChip}>
                  <Play className={styles.chipIcon} fill="currentColor" />
                  {t("watchLive")}
                </span>
                <span className={styles.directionsChip}>
                  <MapPin className={styles.chipIcon} />
                  {t("directions")}
                </span>
              </div>
            </div>

            <div className={styles.eventCard}>
              <p className={styles.eventName}>{t("reception")}</p>
              <p className={styles.eventMeta}>{t("receptionMeta")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.whatsappCard}>
        <div className={styles.whatsappHeader}>
          <span className={styles.whatsappBadge}>
            <MessageCircle className={styles.whatsappIcon} fill="currentColor" />
          </span>
          <span className={styles.whatsappTitle}>{t("whatsappTitle")}</span>
        </div>
        <div className={styles.whatsappBubble}>
          <p>{t("whatsappMessage")}</p>
          <p className={styles.whatsappLink}>{t("whatsappLink")}</p>
        </div>
      </div>
    </div>
  );
}
