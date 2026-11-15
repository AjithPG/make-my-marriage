import styles from "./section-heading.module.css";

type SectionHeadingProps = {
  /** Put the same id in the section's `aria-labelledby`. */
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  align?: "center" | "start";
};

/** Small label + section title (h2) + optional intro line. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div
      className={
        align === "center" ? styles.headingCentered : styles.headingStart
      }
    >
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {intro ? <p className={styles.intro}>{intro}</p> : null}
    </div>
  );
}
