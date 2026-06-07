import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "POS Income Expense | Coffee Shop",
  description: "ระบบบันทึกรายรับ-รายจ่ายสำหรับร้านกาแฟ",
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
