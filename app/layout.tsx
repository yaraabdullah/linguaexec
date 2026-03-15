import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "LinguaExec — AI Language Learning for Executives",
  description: "Master Arabic, English, or Spanish in minutes a day. Powered by AI, designed for busy professionals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen" style={{ background: "#080d1a" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
