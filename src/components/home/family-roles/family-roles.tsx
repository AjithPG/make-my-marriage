import { getTranslations } from "next-intl/server";
import { Shield, UserCog } from "lucide-react";
import { SectionHeading } from "../section-heading/section-heading";
import styles from "./family-roles.module.css";

const MEMBERS = [
  { key: "member1", role: "admin" },
  { key: "member2", role: "admin" },
  { key: "member3", role: "manager" },
] as const;

export async function FamilyRoles() {
  const t = await getTranslations("Landing.family");

  return (
    <section className={styles.familyRoles} aria-labelledby="family-roles-title">
      <div className={styles.sectionInner}>
        <SectionHeading
          id="family-roles-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          intro={t("intro")}
        />

        <ul className={styles.memberList}>
          {MEMBERS.map(({ key, role }) => {
            const isAdmin = role === "admin";
            const RoleIcon = isAdmin ? Shield : UserCog;
            return (
              <li key={key} className={styles.memberCard}>
                <span
                  className={isAdmin ? styles.avatarAdmin : styles.avatarManager}
                  aria-hidden="true"
                >
                  {t(key).charAt(0)}
                </span>
                <div className={styles.memberInfo}>
                  <p className={styles.memberName}>{t(key)}</p>
                  <span
                    className={isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeManager}
                  >
                    {t(role)}
                  </span>
                </div>
                <RoleIcon aria-hidden="true" className={styles.roleIcon} />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
