import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthShell } from "@/components/auth-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STR Market Analyzer",
  description:
    "Analyze U.S. cities for short-term rental investment. Economic, demographic, housing, and STR data in one dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <TooltipProvider>
          <AuthShell>{children}</AuthShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
