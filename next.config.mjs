// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.tippland.de",
        pathname: "/res/uploads/**",
      },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },

      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
