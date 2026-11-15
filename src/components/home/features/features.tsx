import { getTranslations } from "next-intl/server";
import {
  Camera,
  CircleCheck,
  Globe,
  Images,
  ListChecks,
  Lock,
  MessageSquare,
  MonitorPlay,
  Upload,
  Users,
} from "lucide-react";
import { FeatureCard } from "../feature-card/feature-card";
import { SectionHeading } from "../section-heading/section-heading";
import styles from "./features.module.css";

const WHATSAPP_GUESTS = [
  { key: "guest1", invited: false },
  { key: "guest2", invited: true },
  { key: "guest3", invited: false },
] as const;

const TODOS = [
  { key: "item1", done: true },
  { key: "item2", done: true },
  { key: "item3", done: false },
] as const;

export async function Features() {
  const t = await getTranslations("Landing.features");
  const preview = await getTranslations("Landing.preview");

  return (
    // id is the target of the "Features" link in the header.
    <section
      id="features"
      className={styles.features}
      aria-labelledby="features-title"
    >
      <div className={styles.sectionInner}>
        <SectionHeading
          id="features-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          intro={t("intro")}
        />

        {/* The small mockups are decorative (aria-hidden); each card's text says what the feature does. */}
        <ul className={styles.featureGrid}>
          <FeatureCard
            Icon={Globe}
            tag={t("website.tag")}
            title={t("website.title")}
            body={t("website.body")}
            span="wide"
          >
            <div className={styles.browserFrame} aria-hidden="true">
              <div className={styles.browserBar}>
                <span className={styles.browserDots}>
                  <span className={styles.browserDot} />
                  <span className={styles.browserDot} />
                  <span className={styles.browserDot} />
                </span>
                <span className={styles.browserUrl}>
                  <Lock className={styles.browserLockIcon} />
                  {preview("url")}
                </span>
              </div>
              <div className={styles.browserPage}>
                <p className={styles.browserCouple}>{preview("couple")}</p>
                <p className={styles.browserSubtitle}>
                  {t("website.previewSubtitle")}
                </p>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            Icon={MessageSquare}
            tag={t("whatsapp.tag")}
            title={t("whatsapp.title")}
            body={t("whatsapp.body")}
          >
            <div className={styles.rowList} aria-hidden="true">
              {WHATSAPP_GUESTS.map(({ key, invited }) => (
                <div key={key} className={styles.guestRow}>
                  <span className={styles.guestInfo}>
                    <span className={styles.guestAvatar}>
                      {t(`whatsapp.${key}`).charAt(0)}
                    </span>
                    <span className={styles.guestName}>
                      {t(`whatsapp.${key}`)}
                    </span>
                  </span>
                  {invited ? (
                    <span className={styles.invitedChip}>
                      {t("whatsapp.invited")} ✓
                    </span>
                  ) : (
                    <span className={styles.inviteChip}>
                      {t("whatsapp.invite")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            Icon={Users}
            tag={t("guests.tag")}
            title={t("guests.title")}
            body={t("guests.body")}
          >
            <div className={styles.statsPanel} aria-hidden="true">
              <div className={styles.statsHeader}>
                <span className={styles.statsNumber}>{t("guests.count")}</span>
                <span className={styles.statsLabel}>
                  {t("guests.countLabel")}
                </span>
              </div>
              <div className={styles.statsTrack}>
                <div className={styles.statsFill} />
              </div>
              <div className={styles.groupGrid}>
                <div className={styles.groupBox}>
                  <span className={styles.groupLabel}>
                    {t("guests.brideSide")}
                  </span>
                  <span className={styles.groupValue}>
                    {t("guests.brideSideCount")}
                  </span>
                </div>
                <div className={styles.groupBox}>
                  <span className={styles.groupLabel}>
                    {t("guests.groomSide")}
                  </span>
                  <span className={styles.groupValue}>
                    {t("guests.groomSideCount")}
                  </span>
                </div>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            Icon={ListChecks}
            tag={t("todos.tag")}
            title={t("todos.title")}
            body={t("todos.body")}
          >
            <div className={styles.rowList} aria-hidden="true">
              {TODOS.map(({ key, done }) => (
                <div key={key} className={styles.todoRow}>
                  {done ? (
                    <CircleCheck className={styles.todoDoneIcon} />
                  ) : (
                    <span className={styles.todoOpenIcon} />
                  )}
                  <span className={done ? styles.todoTextDone : styles.todoText}>
                    {t(`todos.${key}`)}
                  </span>
                </div>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            Icon={Images}
            tag={t("gallery.tag")}
            title={t("gallery.title")}
            body={t("gallery.body")}
          >
            <div className={styles.galleryGrid} aria-hidden="true">
              <span className={styles.galleryTile}>
                <Images className={styles.galleryIcon} />
              </span>
              <span className={styles.galleryTileHighlight}>
                <Camera className={styles.galleryIcon} />
              </span>
              <span className={styles.galleryTile}>
                <Upload className={styles.galleryIcon} />
              </span>
            </div>
          </FeatureCard>

          <FeatureCard
            Icon={MonitorPlay}
            tag={t("live.tag")}
            title={t("live.title")}
            body={t("live.body")}
            span="wideOnTablet"
          >
            <div className={styles.livePanel}>
              <span className={styles.liveBadge} aria-hidden="true">
                {t("live.badge")}
                <span className={styles.liveDot} />
              </span>
              {/* Real text (not hidden): PRD FR-8.5 wants this stated. */}
              <p className={styles.liveNote}>{t("live.note")}</p>
            </div>
          </FeatureCard>
        </ul>
      </div>
    </section>
  );
}
