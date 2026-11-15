import { getTranslations } from "next-intl/server";
import { Clock, Globe, Navigation } from "lucide-react";
import { SectionHeading } from "../section-heading/section-heading";
import styles from "./guest-experience.module.css";

const POINTS = [
  { key: "events", Icon: Clock },
  { key: "directions", Icon: Navigation },
  { key: "watch", Icon: Globe },
] as const;

const PREVIEW_EVENTS = ["previewEvent1", "previewEvent2"] as const;

export async function GuestExperience() {
  const t = await getTranslations("Landing.guests");

  return (
    <section
      className={styles.guestExperience}
      aria-labelledby="guest-experience-title"
    >
      <div className={styles.sectionInner}>
        {/* Decorative mockup of what a guest sees; the text column explains it. */}
        <div className={styles.previewColumn} aria-hidden="true">
          <div className={styles.previewBackdrop}>
            <span className={styles.previewBadge}>{t("previewBadge")}</span>
            <div className={styles.previewScreen}>
              <div className={styles.previewHeader}>
                <p className={styles.previewWelcome}>{t("previewWelcome")}</p>
                <p className={styles.previewTitle}>{t("previewTitle")}</p>
                <p className={styles.previewBody}>{t("previewBody")}</p>
              </div>
              <div className={styles.previewEvents}>
                {PREVIEW_EVENTS.map((event) => (
                  <div key={event} className={styles.previewEvent}>
                    <div className={styles.previewEventRow}>
                      <span>{t(event)}</span>
                      <span className={styles.previewEventTime}>
                        {t(`${event}Time`)}
                      </span>
                    </div>
                    <p className={styles.previewEventVenue}>
                      {t(`${event}Venue`)}
                    </p>
                  </div>
                ))}
              </div>
              <span className={styles.previewDirections}>
                <Navigation className={styles.previewDirectionsIcon} />
                {t("previewDirections")}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.textColumn}>
          <SectionHeading
            id="guest-experience-title"
            eyebrow={t("eyebrow")}
            title={t("title")}
            intro={t("intro")}
            align="start"
          />
          <ul className={styles.pointList}>
            {POINTS.map(({ key, Icon }) => (
              <li key={key} className={styles.point}>
                <span className={styles.pointIconBox} aria-hidden="true">
                  <Icon className={styles.pointIcon} />
                </span>
                <div>
                  <h3 className={styles.pointTitle}>
                    {t(`points.${key}.title`)}
                  </h3>
                  <p className={styles.pointBody}>{t(`points.${key}.body`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
