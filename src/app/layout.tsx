import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { AppChrome } from "@/components/layout/AppChrome";

const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700", "800"] });
const ui = Manrope({ variable: "--font-ui", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = Spline_Sans_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "DORIS TV",
  description: "A premium community-first streaming platform for independent Nigerian filmmakers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable} ${mono.variable}`}>
      <body suppressHydrationWarning>
        <AppProvider>
          <AppChrome>{children}</AppChrome>
        </AppProvider>
      </body>
    </html>
  );
}
