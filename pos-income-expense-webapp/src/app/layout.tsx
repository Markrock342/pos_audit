import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { OrganizationProvider } from "@/components/providers/OrganizationProvider";

export const metadata: Metadata = {
  title: "สมุดรายรับ-รายจ่าย | บัญชีร้าน",
  description: "ระบบบันทึกรายรับ-รายจ่ายสำหรับร้านค้า",
  applicationName: "บัญชีร้าน",
  appleWebApp: {
    capable: true,
    title: "บัญชีร้าน",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FF6B35" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full">
      <body className="h-full select-none antialiased">
        <AuthProvider>
          <OrganizationProvider>
            <ThemeProvider>
              <AuthGuard>{children}</AuthGuard>
            </ThemeProvider>
          </OrganizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
