import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Inter is the substitute for Mercury's arcadia (custom/commercial font)
// Weights: 400 (body) and 500 (display) — Mercury's signature intermediate weight
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CloudCost AI — Predict your API costs before you build",
  description:
    "Describe your app in plain English. AI reasons about your full API stack and predicts your costs at 1k, 10k, and 100k users — then suggests optimizations to cut your bill.",
  openGraph: {
    title: "CloudCost AI — Predict your API costs before you build",
    description:
      "Describe your app. See your full API stack cost at scale. Cut your bill before you deploy.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
