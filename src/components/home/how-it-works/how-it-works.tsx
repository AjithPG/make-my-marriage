import { getTranslations } from "next-intl/server";
import { CalendarDays, Send, Video } from "lucide-react";
import { SectionHeading } from "../section-heading/section-heading";
import styles from "./how-it-works.module.css";

const STEPS = [
  { key: "events", Icon: CalendarDays },
  { key: "invite", Icon: Send },
  { key: "share", Icon: Video },
] as const;

export async function HowItWorks() {
  const t = await getTranslations("Landing.howItWorks");

  return (
    // id is the target of the "How it works" link in the header.
    <section
      id="how-it-works"
      className={styles.howItWorks}
      aria-labelledby="how-it-works-title"
    >
      <div className={styles.sectionInner}>
        <SectionHeading
          id="how-it-works-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          intro={t("intro")}
        />

        {/* <ol> tells screen readers the order, so the big numbers are decorative. */}
        <ol className={styles.stepList}>
          {STEPS.map(({ key, Icon }, index) => (
            <li key={key} className={styles.stepCard}>
              <div className={styles.stepTop}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.stepIconBox} aria-hidden="true">
                  <Icon className={styles.stepIcon} />
                </span>
              </div>
              <h3 className={styles.stepTitle}>{t(`steps.${key}.title`)}</h3>
              <p className={styles.stepBody}>{t(`steps.${key}.body`)}</p>
              <p className={styles.stepTag}>{t(`steps.${key}.tag`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
