import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeColorInit } from "@/components/ThemeColorInit";
import { AppSessionProvider } from "@/components/providers/AppSessionProvider";
import { OrganizationJsonLd, JsonLdScript } from "next-seo";
import { defaultSeoConfig } from "@/lib/next-seo-config";
import React from "react";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeColorInit />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppSessionProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
            <Toaster />
          </AppSessionProvider>
        </ThemeProvider>

        {/* Global Structured Data */}
        <OrganizationJsonLd
          organizationName={defaultSeoConfig.organization.name}
          url={defaultSeoConfig.organization.url}
          logo={defaultSeoConfig.organization.logo}
          description={defaultSeoConfig.organization.description}
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
      </body>
    </html>
  );
}
