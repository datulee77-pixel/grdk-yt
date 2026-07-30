/** @type {import('next').NextConfig} */
const renderApiUrl = process.env.RENDER_API_URL?.replace(/\/$/, "");

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      "fluent-ffmpeg",
      "@ffmpeg-installer/ffmpeg",
      "@ffprobe-installer/ffprobe",
    ],
  },
  async rewrites() {
    if (!renderApiUrl) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${renderApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
