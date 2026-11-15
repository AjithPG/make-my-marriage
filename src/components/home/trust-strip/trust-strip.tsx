import { getTranslations } from "next-intl/server";
import { Gift, MapPin, PhoneOff, SearchX } from "lucide-react";
import styles from "./trust-strip.module.css";

const ITEMS = [
  { key: "free", Icon: Gift },
  { key: "noApp", Icon: PhoneOff },
  { key: "noSearch", Icon: SearchX },
  { key: "kerala", Icon: MapPin },
] as const;

export async function TrustStrip() {
  const t = await getTranslations("Landing.trust");

  return (
    <section className={styles.trustStrip} aria-label={t("label")}>
      <ul className={styles.trustList}>
        {ITEMS.map(({ key, Icon }) => (
          <li key={key} className={styles.trustItem}>
            <Icon aria-hidden="true" className={styles.trustIcon} />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
