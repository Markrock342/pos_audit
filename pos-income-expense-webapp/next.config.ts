import path from "node:path";
import type { NextConfig } from "next";

const appRoot = path.join(__dirname);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // standalone = kiosk Docker; Vercel ใช้ serverless output ปกติ
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  turbopack: {
    root: appRoot,
  },
  outputFileTracingRoot: appRoot,
};

export default nextConfig;
