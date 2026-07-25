# ---------- next.config.mjs ----------
Set-Content -Path "next.config.mjs" -Encoding UTF8 -Value @'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      "fluent-ffmpeg",
      "@ffmpeg-installer/ffmpeg",
    ],
  },
};

export default nextConfig;
'@

# ---------- tailwind.config.ts ----------
Set-Content -Path "tailwind.config.ts" -Encoding UTF8 -Value @'
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#212529",
          800: "#343a40",
          700: "#495057",
          600: "#6c757d",
        },
        light: "#f8f9fa",
        accent: {
          blue: "#2563eb",
          red: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};

export default config;
'@

# ---------- postcss.config.mjs ----------
Set-Content -Path "postcss.config.mjs" -Encoding UTF8 -Value @'
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
'@

# ---------- .env.local.example ----------
Set-Content -Path ".env.local.example" -Encoding UTF8 -Value @'
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
AUTH_SECRET=generate_with_openssl_rand_base64_32
'@

Write-Host "PART 1 DONE: config files created." -ForegroundColor Green