# YouTube Video Generator & Uploader

A production-ready Next.js 14 web application that generates Full HD videos from an
audio track + a static image, then uploads them directly to YouTube via the
YouTube Data API v3.

## Features

- 🔐 Google OAuth 2.0 authentication (NextAuth.js v5, JWT sessions)
- 🎬 FFmpeg video generation (1920×1080, H.264, AAC, YouTube-standard settings)
- 📤 Direct upload to YouTube with custom metadata
- 🎨 Dark-theme responsive UI (Tailwind CSS)
- 🔒 Secure media serving with directory-traversal protection
- ⚡ No database required — sessions live in encrypted httpOnly cookies

## Temporary-video storage

Rendered videos are stored in the private Supabase Storage bucket named
`temp-videos`. Each object is assigned to an opaque, user-specific path and is
served only through a short-lived signed URL. Once YouTube confirms the upload,
the object is queued for deletion after one minute.

Set these server-only environment variables locally and in Vercel:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_TEMP_VIDEOS_BUCKET=temp-videos
CRON_SECRET=a-long-random-secret
```

`vercel.json` invokes `/api/cleanup` every minute. The cleanup endpoint requires
the configured `CRON_SECRET` as a bearer token.

## Tech Stack

- Next.js 14 (App Router) + TypeScript (strict)
- React 18
- NextAuth.js v5 (Google OAuth)
- fluent-ffmpeg + @ffmpeg-installer/ffmpeg
- googleapis (YouTube Data API v3)
- Tailwind CSS + Lucide React

## Setup

### 1. Create a Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable **YouTube Data API v3** (APIs & Services → Library)

### 2. Create OAuth Credentials

1. APIs & Services → **Credentials**
2. Create **OAuth 2.0 Client ID** → Application type: **Web application**
3. Add an authorized redirect URI:
