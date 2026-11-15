import { getTranslations } from "next-intl/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "../section-heading/section-heading";
import styles from "./faq.module.css";

const QUESTIONS = ["free", "app", "privacy", "whatsapp", "stream"] as const;

export async function Faq() {
  const t = await getTranslations("Landing.faq");

  return (
    // id is the target of the "FAQ" link in the header.
    <section id="faq" className={styles.faq} aria-labelledby="faq-title">
      <div className={styles.sectionInner}>
        <div className={styles.headingColumn}>
          <SectionHeading
            id="faq-title"
            eyebrow={t("eyebrow")}
            title={t("title")}
            intro={t("intro")}
            align="start"
          />
        </div>

        {/* shadcn Accordion (Radix): keyboard support and aria-expanded built in. */}
        <Accordion
          type="single"
          collapsible
          defaultValue={QUESTIONS[0]}
          className={styles.questionList}
        >
          {QUESTIONS.map((key) => (
            <AccordionItem key={key} value={key} className={styles.questionItem}>
              <AccordionTrigger className={styles.questionTrigger}>
                {t(`items.${key}.question`)}
              </AccordionTrigger>
              <AccordionContent className={styles.answer}>
                {t(`items.${key}.answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
