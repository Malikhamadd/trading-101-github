import "./globals.css";
import type { Metadata } from "next";
import React from "react";
import { PwaProvider } from "@/components/pwa-provider";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Trading 101 Dashboard",
  description: "Trading PWA for markets, bots, and analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#38BDF8" />
      </head>
      <body>
        <PwaProvider>
          <Shell>{children}</Shell>
        </PwaProvider>
      </body>
    </html>
  );
}
