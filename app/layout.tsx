import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono, Hind_Madurai } from "next/font/google";
import { MockDataBanner } from "@/components/MockDataBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display serif for headings: gives the brand a warm, crafted feel.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

// Tamil script for the wordmark and occasion names.
const hindMadurai = Hind_Madurai({
  variable: "--font-hind-madurai",
  subsets: ["tamil"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Kaivannam — Handmade gifts, made just for you",
    template: "%s · Kaivannam",
  },
  description:
    "Order personalised handmade gifts from Tamil Nadu artists. Customise, approve a preview, and pay safely.",
};

export const viewport: Viewport = {
  themeColor: "#f9f5ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${hindMadurai.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Suspense fallback={null}>
          <MockDataBanner />
        </Suspense>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
