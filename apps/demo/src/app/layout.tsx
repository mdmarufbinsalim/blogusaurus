import type { Metadata } from "next";
import "blogusaurus/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blogusaurus",
  description: "Rich-text blog creator and renderer for any Next.js app",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
