import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import CommandPalette from "@/components/search/CommandPalette";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crypto Dev — Web3 Developer Platform",
  description:
    "Production-grade Web3 developer shell with multi-chain support, bot forge, and ecosystem integrations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark", "h-full", inter.variable, jetbrains.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-screen bg-background text-foreground overflow-hidden">
        <Providers>
          {/* Skip to main content — WCAG AA */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-[#0d0d0f] focus:font-semibold focus:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#0d0d0f]"
          >
            Skip to main content
          </a>
          <div className="flex h-screen">
            <Sidebar />
            <main
              id="main-content"
              className="flex-1 ml-0 md:ml-[var(--sidebar-w)] flex flex-col overflow-hidden"
              tabIndex={-1}
            >
              {children}
            </main>
          </div>
          <CommandPalette />
        </Providers>
      </body>
    </html>
  );
}
