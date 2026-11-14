import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const t = await getTranslations("Home");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="max-w-md text-muted-foreground">{t("tagline")}</p>
      <Button size="lg">{t("cta")}</Button>
    </main>
  );
}
