import type { NextConfig } from "next";

function getBackendUrl(): string {
  const configuredUrl = process.env.BACKEND_URL?.trim();

  if (!configuredUrl) {
    throw new Error("BACKEND_URL must be set to the backend host or URL.");
  }

  const backendUrl = /^[a-z][a-z\d+.-]*:\/\//i.test(configuredUrl)
    ? configuredUrl
    : `http://${configuredUrl}`;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(backendUrl);
  } catch {
    throw new Error("BACKEND_URL must be a valid backend host or URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("BACKEND_URL must use the http or https protocol.");
  }

  return backendUrl.replace(/\/+$/, "");
}

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${getBackendUrl()}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
