import { getTranslations } from "next-intl/server";
import { ArrowRight, CircleCheck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPreview } from "../hero-preview/hero-preview";
import styles from "./hero.module.css";

const POINTS = ["noApp", "oneSitting", "noSearch"] as const;

export async function Hero() {
  const t = await getTranslations("Landing.hero");

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroInner}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            {t("eyebrow")}
          </p>

          <h1 id="hero-title" className={styles.title}>
            {t("titleStart")}{" "}
            <em className={styles.titleEmphasis}>{t("titleEmphasis")}</em>{" "}
            {t("titleEnd")}
          </h1>

          <p className={styles.subtitle}>{t("subtitle")}</p>

          {/* Links point to "#" until sign-up and the sample site exist. */}
          <div className={styles.ctaGroup}>
            <Button asChild size="lg" className={styles.primaryCta}>
              <a href="#">
                {t("primaryCta")}
                <ArrowRight aria-hidden="true" className={styles.ctaIcon} />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className={styles.secondaryCta}
            >
              <a href="#">
                <Eye aria-hidden="true" className={styles.secondaryCtaIcon} />
                {t("secondaryCta")}
              </a>
            </Button>
          </div>

          <ul className={styles.pointList}>
            {POINTS.map((point) => (
              <li key={point} className={styles.point}>
                <CircleCheck aria-hidden="true" className={styles.pointIcon} />
                {t(`points.${point}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.heroVisual}>
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
