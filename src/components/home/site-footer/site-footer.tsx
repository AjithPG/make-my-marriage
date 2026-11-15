import { getTranslations } from "next-intl/server";
import { BrandLogo } from "../brand-logo/brand-logo";
import styles from "./site-footer.module.css";

export async function SiteFooter() {
  const t = await getTranslations("Marketing");
  // Pages don't exist yet, so links point to "#" for now.
  const links = [
    { key: "privacy", label: t("footer.privacy") },
    { key: "terms", label: t("footer.terms") },
    { key: "contact", label: t("footer.contact") },
    { key: "report", label: t("footer.report") },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <BrandLogo name={t("brand")} size="small" />
          <span className={styles.footerDivider} aria-hidden="true" />
          <p className={styles.copyright}>
            {t("footer.copyright", { year: 2026 })}
          </p>
        </div>

        <nav aria-label={t("footer.label")}>
          <ul className={styles.footerLinks}>
            {links.map((link) => (
              <li key={link.key}>
                <a href="#" className={styles.footerLink}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
