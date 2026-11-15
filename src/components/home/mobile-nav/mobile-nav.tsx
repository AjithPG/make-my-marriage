"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import styles from "./mobile-nav.module.css";

type MobileNavProps = {
  links: { href: string; label: string }[];
  navLabel: string;
  loginLabel: string;
  openLabel: string;
  closeLabel: string;
};

export function MobileNav({
  links,
  navLabel,
  loginLabel,
  openLabel,
  closeLabel,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Escape closes the menu and returns focus to the toggle.
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <div className={styles.mobileNav}>
      <button
        ref={toggleRef}
        type="button"
        className={styles.menuToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? closeLabel : openLabel}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? (
          <X aria-hidden="true" className={styles.menuIcon} />
        ) : (
          <Menu aria-hidden="true" className={styles.menuIcon} />
        )}
      </button>

      <nav
        id={panelId}
        aria-label={navLabel}
        className={styles.menuPanel}
        hidden={!isOpen}
      >
        <ul className={styles.menuList}>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={styles.menuLink} onClick={close}>
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a href="#" className={styles.menuLink} onClick={close}>
              {loginLabel}
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
