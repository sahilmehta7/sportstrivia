import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { SessionProvider } from "next-auth/react";
import { getOrganizationSchema, getWebSiteSchema } from "@/lib/schema-utils";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sports Trivia - Test Your Sports Knowledge",
  description: "Compete with friends, climb the leaderboards, and become a sports trivia champion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebSiteSchema();

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
          <Toaster />
        </SessionProvider>

        {/* Global Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </body>
    </html>
  );
}

