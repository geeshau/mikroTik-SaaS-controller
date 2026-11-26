import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vortex — MikroTik SaaS Platform",
  description: "High-performance, multi-tenant MikroTik management platform for WISPs and MSPs. Zero-exposure security via WireGuard tunnels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-to-br from-[#eef9f4] via-[#f0f7f4] to-[#e8f4f0] text-slate-800">{children}</body>
    </html>
  );
}
