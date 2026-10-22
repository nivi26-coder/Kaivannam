import type { NextConfig } from "next";
import { UNSPLASH_PARAMS } from "./lib/images";

const nextConfig: NextConfig = {
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
  images: {
    // Demo photos come from Unsplash. Only the exact query string our
    // unsplash() helper produces is allowed, so nobody can use our image
    // optimizer to resize arbitrary URLs. When real uploads arrive (MVP),
    // add the image host here, e.g. Cloudinary's res.cloudinary.com.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/photo-*",
        search: UNSPLASH_PARAMS,
      },
    ],
  },
};

export default nextConfig;
