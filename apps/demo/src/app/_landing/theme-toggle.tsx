"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

type Theme = "light" | "dark";

// The source of truth is the attribute on <html>; the inline script in layout.tsx sets it before paint.
function subscribe(cb: () => void) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | undefined>(subscribe, getTheme, () => undefined);

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        const next: Theme = theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("theme", next);
        } catch {}
      }}
    >
      {/* Both icons render; CSS shows the right one, so server and client markup match. */}
      <SunIcon size={18} className="icon-sun" />
      <MoonIcon size={18} className="icon-moon" />
    </button>
  );
}
