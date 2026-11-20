import Link from "next/link";
import { Heart } from "lucide-react";
import styles from "./brand-logo.module.css";

type BrandLogoProps = {
  name: string;
  size?: "default" | "small";
  /** "inverse" is for wine backgrounds (auth panel). */
  tone?: "default" | "inverse";
};

export function BrandLogo({
  name,
  size = "default",
  tone = "default",
}: BrandLogoProps) {
  const isSmall = size === "small";
  const isInverse = tone === "inverse";
  const markClass = isSmall
    ? styles.brandMarkSmall
    : isInverse
      ? styles.brandMarkInverse
      : styles.brandMark;
  const nameClass = isSmall
    ? styles.brandNameSmall
    : isInverse
      ? styles.brandNameInverse
      : styles.brandName;

  return (
    <Link
      href="/"
      className={isInverse ? styles.brandLinkInverse : styles.brandLink}
    >
      <span className={markClass} aria-hidden="true">
        <Heart
          className={isSmall ? styles.brandIconSmall : styles.brandIcon}
          fill="currentColor"
        />
      </span>
      <span className={nameClass}>{name}</span>
    </Link>
  );
}
