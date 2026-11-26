import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { SwrProvider } from "@/lib/swr-provider";
import { PwaInstallPrompt } from "@/components/ui/PwaInstallPrompt";
import { Toaster } from 'sonner';
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vortex',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#14b8a6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('vortex-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()` }} />
      </head>
      <body className="min-h-full flex flex-col bg-gradient-to-br from-[#eef9f4] via-[#f0f7f4] to-[#e8f4f0] text-slate-800 dark:text-slate-200">
        <ThemeProvider>
          <SwrProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                className: 'glass-card !bg-white/90 dark:!bg-slate-800/90 !border-slate-200/50 dark:!border-slate-700/50 !text-slate-800 dark:!text-slate-200 !shadow-xl',
                duration: 4000,
              }}
              closeButton
            />
            <PwaInstallPrompt />
          </SwrProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
