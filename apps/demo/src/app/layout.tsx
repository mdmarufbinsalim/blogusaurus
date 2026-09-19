import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "blogusaurus/styles.css";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

// Runs before paint: saved choice, else the OS preference.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})()`;

export const metadata: Metadata = {
  title: "Blogusaurus: a drop-in blog editor for Next.js",
  description:
    "A rich-text blog creator and a server-safe renderer for React and Next.js. Bring your own backend. No Tailwind, no shadcn, no setup.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme attribute is set by the script below before first paint, so it differs from the server HTML.
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
