import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FPLProvider } from "@/context/FPLContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FPL Scout — Fantasy Premier League Dashboard",
  description:
    "Production-quality FPL decision support: lineup optimizer, transfer recommendations, fixture difficulty, and projected points — all from the official FPL API.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-fpl-bg text-fpl-text-primary antialiased">
        <FPLProvider>{children}</FPLProvider>
      </body>
    </html>
  );
}
