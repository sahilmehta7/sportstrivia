import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeColorInit } from "@/components/ThemeColorInit";
import { AppSessionProvider } from "@/components/providers/AppSessionProvider";
import { OrganizationJsonLd, JsonLdScript } from "next-seo";
import { defaultSeoConfig } from "@/lib/next-seo-config";
import React from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.sportstrivia.in"),
  title: {
    default: "Sports Trivia - Test Your Sports Knowledge",
    template: "%s | Sports Trivia",
  },
  description: "Compete with friends, climb the leaderboards, and become a sports trivia champion",
  keywords: ["sports", "trivia", "quiz", "sports knowledge", "competitive gaming"],
  authors: [{ name: "Sports Trivia Team" }],
  creator: "Sports Trivia",
  publisher: "Sports Trivia",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/logo.png" },
      { url: "/logo-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [{ url: "/logo.png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://www.sportstrivia.in",
    siteName: "Sports Trivia",
    title: "Sports Trivia - Test Your Sports Knowledge",
    description: "Compete with friends, climb the leaderboards, and become a sports trivia champion",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sports Trivia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sports Trivia - Test Your Sports Knowledge",
    description: "Compete with friends, climb the leaderboards, and become a sports trivia champion",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification codes when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  category: "Sports & Recreation",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head />
      <body className={cn(barlow.className, barlowCondensed.variable, "antialiased")}>
        <ThemeColorInit />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AppSessionProvider session={session}>
            <ShowcaseThemeProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
            </ShowcaseThemeProvider>
            <Toaster />
          </AppSessionProvider>
        </ThemeProvider>

        {/* Global Structured Data */}
        <OrganizationJsonLd
          name={defaultSeoConfig.organization.name}
          url={defaultSeoConfig.organization.url}
          logo={defaultSeoConfig.organization.logo}
        />
        <JsonLdScript
          scriptKey="website-jsonld"
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            url: defaultSeoConfig.siteUrl,
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${defaultSeoConfig.siteUrl}/quizzes?search={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          }}
        />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-DKRBB31VSK"} />
      </body>
    </html>
  );
}
