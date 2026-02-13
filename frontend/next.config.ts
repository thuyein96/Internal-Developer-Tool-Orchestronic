import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://img.icons8.com/**"),
      new URL("https://flagsapi.com/**"),
    ],
  },
  // rewrites: async () => [
  //   {
  //     source: "/api/:path*",
  //     destination: "https://13fbad8cad05.ngrok-free.app/:path*",
  //   },
  // ],
}

export default nextConfig
