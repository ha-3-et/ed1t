/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,

  async redirects() {
    if (process.env.REDIRECT_SUBDOMAIN && process.env.REDIRECT_DESTINATION) {
      return [
        {
          has: [{ type: "host", value: process.env.REDIRECT_SUBDOMAIN }],
          source: "/:path*",
          destination: process.env.REDIRECT_DESTINATION,
          permanent: true,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
