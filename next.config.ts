import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["p1.music.126.net", "p2.music.126.net"], // 添加允许的域名
  },
};

export default nextConfig;
