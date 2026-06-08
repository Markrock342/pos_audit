import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { OrganizationProvider } from "@/components/providers/OrganizationProvider";

export const metadata: Metadata = {
  title: "สมุดรายรับ-รายจ่าย | บัญชีร้าน",
  description: "ระบบบันทึกรายรับ-รายจ่ายสำหรับร้านค้า",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full select-none antialiased">
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
