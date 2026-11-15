import Link from "next/link";
import { Heart } from "lucide-react";
import styles from "./brand-logo.module.css";

type BrandLogoProps = {
  name: string;
  size?: "default" | "small";
};

export function BrandLogo({ name, size = "default" }: BrandLogoProps) {
  const isSmall = size === "small";
  return (
    <Link href="/" className={styles.brandLink}>
      <span
        className={isSmall ? styles.brandMarkSmall : styles.brandMark}
        aria-hidden="true"
      >
        <Heart
          className={isSmall ? styles.brandIconSmall : styles.brandIcon}
          fill="currentColor"
        />
      </span>
      <span className={isSmall ? styles.brandNameSmall : styles.brandName}>
        {name}
      </span>
    </Link>
  );
}
