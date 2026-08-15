import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Qoreva™",
    template: "%s | Qoreva™",
  },

  description:
    "AI-powered work readiness, safety, planning, and field operations platform.",

  applicationName: "Qoreva™",

  keywords: [
    "construction safety",
    "work readiness",
    "field operations",
    "construction planning",
    "contractor management",
    "worker safety",
    "AI safety software",
    "Qoreva",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="min-h-full"
    >
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          min-h-screen
          bg-[#F4F1EA]
          font-sans
          text-[#18181B]
          antialiased
        `}
      >
        {children}
      </body>
    </html>
  );
}