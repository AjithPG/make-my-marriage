import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

// Shared 404 for unknown routes and, later, unpublished or unknown wedding slugs (PRD FR-6.5).
export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="max-w-md text-muted-foreground">{t("body")}</p>
      <Button asChild variant="outline">
        <Link href="/">{t("home")}</Link>
      </Button>
    </main>
  );
}
