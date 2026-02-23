import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { NavigationBar } from "@/components/navigation-bar";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next Template",
  description: "A simple Next.js template with shadcn-style components.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NavigationBar />
        <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-5xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
