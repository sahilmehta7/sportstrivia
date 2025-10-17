import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { SessionProvider } from "next-auth/react";
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
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}

