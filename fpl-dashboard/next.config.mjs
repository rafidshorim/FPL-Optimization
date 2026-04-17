/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "resources.premierleague.com",
        pathname: "/premierleague/photos/players/**",
      },
      {
        // FPL jersey / shirt images
        protocol: "https",
        hostname: "fantasy.premierleague.com",
        pathname: "/dist/img/shirts/**",
      },
    ],
  },
};

export default nextConfig;
