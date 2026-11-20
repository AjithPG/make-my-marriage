"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./logout-button.module.css";

export function LogoutButton() {
  const t = useTranslations("Auth");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function logOut() {
    setPending(true);
    setFailed(false);
    try {
      // Always 204: the server ends the session and clears the cookie.
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      setFailed(true);
      setPending(false);
      return;
    }
    // Full page load, not router.replace(): with cacheComponents the client
    // router keeps visited pages (and their state) alive, so a later visit to
    // /welcome would show this button still "Logging out…" — and the previous
    // user's page would linger in memory. A hard navigation drops all of it.
    window.location.replace("/login");
  }

  return (
    <div className={styles.wrapper}>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={logOut}
        className={styles.button}
      >
        <LogOut aria-hidden="true" className={styles.icon} />
        {pending ? t("welcome.loggingOut") : t("welcome.logOut")}
      </Button>
      {failed && (
        <p role="alert" className={styles.error}>
          {t("errors.generic")}
        </p>
      )}
    </div>
  );
}
