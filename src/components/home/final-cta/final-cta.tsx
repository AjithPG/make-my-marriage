import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./final-cta.module.css";

export async function FinalCta() {
  const t = await getTranslations("Landing.finalCta");

  return (
    <section className={styles.finalCta} aria-labelledby="final-cta-title">
      <div className={styles.ctaPanel}>
        {/* Decorative rings in the wine panel. */}
        <span className={styles.ringTopLeft} aria-hidden="true" />
        <span className={styles.ringBottomRight} aria-hidden="true" />
        <span className={styles.ringCenter} aria-hidden="true" />

        <div className={styles.ctaContent}>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h2 id="final-cta-title" className={styles.title}>
            {t("title")}
          </h2>
          <p className={styles.body}>{t("body")}</p>
          {/* Points to "#" until sign-up exists. */}
          <Button asChild size="lg" className={styles.ctaButton}>
            <a href="#">
              {t("cta")}
              <ArrowRight aria-hidden="true" className={styles.ctaIcon} />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
