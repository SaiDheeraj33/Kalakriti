import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "@kalakriti/ui/tokens.css";
import "./globals.css";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "KALAKRITI — Handcrafted Heritage, Delivered Home",
    template: "%s · KALAKRITI",
  },
  description:
    "Antiques, handmade crafts, traditional looms and exclusive heritage sarees — sourced directly from master artisans across India.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${inter.variable} font-sans bg-ivory text-ink antialiased min-h-screen flex flex-col`}
      >
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
