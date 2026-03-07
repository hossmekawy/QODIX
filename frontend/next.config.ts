import type { NextConfig } from "next";
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.1.113", "qodix.167.86.71.246.nip.io"]
};

export default withPWA(nextConfig);
