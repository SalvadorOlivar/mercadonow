import { resolvePublicApiUrl } from "./config/public-env.mjs";

const apiUrl = resolvePublicApiUrl(process.env);

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
};

export default nextConfig;
