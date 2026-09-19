import type { BlogusaurusTheme } from "blogusaurus";

// Theming lives in code. `inherit` (the default) follows the host: the editor goes dark
// whenever an ancestor has `data-theme="dark"` or the `dark` class, which is what the
// site's toggle sets on <html>.
export const theme: BlogusaurusTheme = {
  mode: "inherit",
  radius: "0.75rem",
  colors: { primary: "#4f46e5", primaryForeground: "#ffffff", brand: "#6366f1" },
  dark: { primary: "#818cf8", primaryForeground: "#0b0b14", brand: "#818cf8" },
};
