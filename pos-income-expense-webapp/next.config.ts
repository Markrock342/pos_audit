import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // standalone = kiosk Docker; Vercel ใช้ serverless output ปกติ
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
};

export default nextConfig;
