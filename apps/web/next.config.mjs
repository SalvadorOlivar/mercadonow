/** @type {import('next').NextConfig} */
const nextConfig = {
  // Backend API base URL (NestJS dev server).
  // Override via env when running in containers / prod.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  },
};

export default nextConfig;