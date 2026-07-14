/** @type {import('next').NextConfig} */
const nextConfig = {
  // The shared ForgeUI packages ship as workspace deps; Next transpiles them.
  transpilePackages: ["@forgeui/core", "@forgeui/generate"],
  // Serve the pre-generated `forgeui verify` report (public/demo.html) at /demo.
  async rewrites() {
    return [{ source: "/demo", destination: "/demo.html" }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.figma.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "s3-alpha.figma.com" },
      { protocol: "https", hostname: "s3-alpha-sig.figma.com" },
    ],
  },
};

module.exports = nextConfig;
