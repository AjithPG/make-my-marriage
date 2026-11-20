import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "../brand-logo/brand-logo";
import { MobileNav } from "../mobile-nav/mobile-nav";
import styles from "./site-header.module.css";

export async function SiteHeader() {
  const t = await getTranslations("Marketing");
  const links = [
    { href: "#features", label: t("nav.features") },
    { href: "#how-it-works", label: t("nav.howItWorks") },
    { href: "#faq", label: t("nav.faq") },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <BrandLogo name={t("brand")} />

        <nav aria-label={t("nav.label")} className={styles.desktopNav}>
          <ul className={styles.navList}>
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={styles.navLink}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.headerActions}>
          <a href="/login" className={styles.loginLink}>
            {t("nav.logIn")}
          </a>
          <Button asChild className={styles.createButton}>
            <a href="/signup">
              <span className={styles.createLabelLong}>{t("nav.create")}</span>
              <span className={styles.createLabelShort}>
                {t("nav.createShort")}
              </span>
              <ArrowRight aria-hidden="true" className={styles.createIcon} />
            </a>
          </Button>
          <MobileNav
            links={links}
            navLabel={t("nav.label")}
            loginLabel={t("nav.logIn")}
            openLabel={t("nav.openMenu")}
            closeLabel={t("nav.closeMenu")}
          />
        </div>
      </div>
    </header>
  );
}
