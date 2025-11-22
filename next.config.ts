import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["dummyjson.com"], // allow external avatars
  },
};

export default nextConfig;
