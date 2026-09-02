import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import CurtainLoader from "./components/CurtainLoader";
import SmoothScroll from "./components/SmoothScroll";
import { project } from "./content";
import "./globals.css";

const mono = JetBrains_Mono({
  variable: "--font-ld-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: project.title,
  description: project.description,
  openGraph: {
    title: project.title,
    description: project.description,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${mono.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-ld-dark text-ink">
        <CurtainLoader />
        <SmoothScroll>{children}</SmoothScroll>
        <Toaster />
      </body>
    </html>
  );
}
