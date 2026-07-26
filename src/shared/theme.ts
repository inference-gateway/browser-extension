// Shared theme control for the standalone pages (options + popup). shadcn's dark
// mode is class-based (.dark), so we toggle that class rather than data-theme.
// "system" follows the OS live: we keep a matchMedia listener while it's active.
export type Theme = "system" | "light" | "dark";

// Resolve to a concrete light/dark given the chosen theme and the OS preference.
export function resolveDark(theme: Theme, prefersDark: boolean): boolean {
  return theme === "dark" || (theme === "system" && prefersDark);
}

let mql: MediaQueryList | null = null;
let onChange: (() => void) | null = null;

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const setDark = (dark: boolean) => {
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  };

  if (mql && onChange) mql.removeEventListener("change", onChange);
  mql = null;
  onChange = null;

  if (theme === "system") {
    mql = window.matchMedia("(prefers-color-scheme: dark)");
    onChange = () => setDark(mql!.matches);
    mql.addEventListener("change", onChange);
    setDark(resolveDark("system", mql.matches));
  } else {
    setDark(resolveDark(theme, false));
  }
}
