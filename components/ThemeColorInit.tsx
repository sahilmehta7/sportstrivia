import Script from "next/script";

const themeInitScript = `(function () {
  try {
    const storageKey = "theme";
    const classList = document.documentElement.classList;
    const stored = window.localStorage.getItem(storageKey);
    let resolved;
    
    // Handle explicit light/dark preferences
    if (stored === "light" || stored === "dark") {
      resolved = stored;
    } else {
      // Handle "system" theme or no stored preference - resolve using system preference
      // This matches next-themes behavior when defaultTheme="system"
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    
    classList.remove("light", "dark");
    classList.add(resolved);
    document.documentElement.style.colorScheme = resolved;
  } catch (error) {
    // If anything fails we fall back to the default browser paint.
  }
})();`;

export function ThemeColorInit() {
  // Using beforeInteractive to prevent FOUC (Flash of Unstyled Content) in App Router
  return (
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script id="theme-color-init" strategy="beforeInteractive">
      {themeInitScript}
    </Script>
  );
}

