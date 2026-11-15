import type { LucideIcon } from "lucide-react";
import styles from "./feature-card.module.css";

type FeatureCardProps = {
  Icon: LucideIcon;
  tag: string;
  title: string;
  body: string;
  /** "wide" spans 2 columns on desktop; "wideOnTablet" spans 2 columns on tablet only. */
  span?: "default" | "wide" | "wideOnTablet";
  /** The small illustration under the text. */
  children: React.ReactNode;
};

const SPAN_CLASS = {
  default: styles.featureCard,
  wide: styles.featureCardWide,
  wideOnTablet: styles.featureCardWideOnTablet,
};

export function FeatureCard({
  Icon,
  tag,
  title,
  body,
  span = "default",
  children,
}: FeatureCardProps) {
  return (
    <li className={SPAN_CLASS[span]}>
      <div className={styles.cardText}>
        <p className={styles.cardTag}>
          <span className={styles.cardIconBox} aria-hidden="true">
            <Icon className={styles.cardIcon} />
          </span>
          {tag}
        </p>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardBody}>{body}</p>
      </div>
      <div className={styles.cardVisual}>{children}</div>
    </li>
  );
}
