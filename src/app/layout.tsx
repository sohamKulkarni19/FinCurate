import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinCurate 2.0 | Mutual Fund Analytics",
  description: "Modern, dynamic mutual fund analytics dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased selection:bg-teal-500/30`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
