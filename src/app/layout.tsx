// app/layout.tsx atau app/root-layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ui/theme-provider"; // pastikan ini benar
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { AppUpdateBanner } from "@/components/app/AppUpdateBanner";
import { PwaInstallPrompt } from "@/components/app/PwaInstallPrompt";
import { ServiceWorkerRegister } from "@/components/app/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Work Team Support",
  description: "Aplikasi manajemen jadwal dan asistensi operasi",
  manifest: "/manifest.webmanifest",
  applicationName: "Work Team Support",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Work Team Support",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster />
          <SonnerToaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 3200,
            }}
          />
          <ServiceWorkerRegister />
          <PwaInstallPrompt />
          <AppUpdateBanner />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
