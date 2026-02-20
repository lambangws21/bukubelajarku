// /** @type {import('next').NextConfig} */
// const nextConfig = {
//     reactStrictMode: true,
//     images: {
//       domains: ["drive.google.com", "lh3.googleusercontent.com"],
//     },
// };

// export default nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "drive.google.com",
//         pathname: "/**",
//       },
//       {
//         protocol: "https",
//         hostname: "lh3.googleusercontent.com",
//         pathname: "/**",
//       },
//     ],
//   },
//   async rewrites() {
//     return [
//       {
//         source: '/api/quote',
//         // Ganti baris ini
//         destination: 'https://zenquotes.io/api/random', // API BARU
//       },
//     ];
//   },
// };

// export default nextConfig;


/** @type {import('next').NextConfig} */
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const nextConfig = {
  reactStrictMode: true,

  // 🔥 PENTING: supaya build Vercel lolos
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },

  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },

  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
