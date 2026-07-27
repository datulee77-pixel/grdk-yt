# StudioFlow YouTube Uploader

StudioFlow turns an audio track and cover image into a 1080p video and uploads
the result to YouTube. The web application and FFmpeg renderer run together on
Render. Source files upload directly from the browser to private Supabase
Storage, so they do not pass through the Render request proxy.

## Architecture

1. A signed-in user selects an audio file and image.
2. The app issues short-lived, user-scoped Supabase upload tickets.
3. The browser uploads both source files directly to the private
   `temp-videos` bucket.
4. The Render service downloads the inputs, renders with FFmpeg, and uploads the
   resulting MP4 to the same private bucket.
5. After YouTube accepts the video, the temporary MP4 is deleted.

## Required services

- A Render account
- A Supabase project
- A Google Cloud project with YouTube Data API v3 enabled

## Supabase setup

Create a private Storage bucket named `temp-videos`. In the bucket settings,
allow these MIME types:

- `audio/mpeg`
- `audio/mp3`
- `audio/wav`
- `audio/x-wav`
- `audio/m4a`
- `audio/x-m4a`
- `audio/mp4`
- `audio/aac`
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`
- `video/mp4`

Set the bucket file-size limit high enough for the source files you expect.
The service role key stays server-only. The anon key is intentionally exposed
to the browser, but it can only use the short-lived signed upload tokens issued
by the authenticated application.

## Google OAuth setup

In Google Cloud:

1. Enable **YouTube Data API v3**.
2. Create an OAuth 2.0 Client ID with application type **Web application**.
3. After Render assigns the service URL, add:

   `https://YOUR-SERVICE.onrender.com/api/auth/callback/google`

4. If you attach a custom domain, add its equivalent callback URL too.

## Deploy to Render

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint** and connect the repository.
3. Render reads `render.yaml` and asks for the secret values marked
   `sync: false`.
4. Enter:

   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

5. Deploy, copy the assigned Render URL, and add the Google callback described
   above.
6. Redeploy after changing the Google OAuth configuration.

Use at least the Render Starter plan. FFmpeg rendering is CPU- and
memory-intensive; longer videos may require a larger instance.

## Local development

Copy `.env.example` to `.env.local`, fill in the values, then run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
