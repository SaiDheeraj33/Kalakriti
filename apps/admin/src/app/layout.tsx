import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "@kalakriti/ui/tokens.css";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Kalakriti Admin",
    template: "%s · Kalakriti Admin",
  },
  description: "Operations dashboard for the Kalakriti heritage marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${inter.variable} font-sans bg-ivory text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
