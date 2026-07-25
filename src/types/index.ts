// Privacy status options for YouTube uploads
export type PrivacyStatus = "private" | "unlisted" | "public";

// Video metadata for YouTube upload
export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacyStatus: PrivacyStatus;
}

// Response from the video generation endpoint
export interface GenerateResponse {
  videoPath: string;
  videoUrl: string;
  duration: number;
}

// Response from the YouTube upload endpoint
export interface UploadResponse {
  videoId: string;
  videoUrl: string;
  title: string;
}

// Generic API error response
export interface ApiError {
  error: string;
  details?: string;
}

// YouTube category option
export interface CategoryOption {
  id: string;
  label: string;
}

// Privacy option for select dropdown
export interface PrivacyOption {
  value: PrivacyStatus;
  label: string;
}

// Available YouTube categories
export const CATEGORIES: CategoryOption[] = [
  { id: "10", label: "Music" },
  { id: "20", label: "Gaming" },
  { id: "21", label: "People & Blogs" },
  { id: "27", label: "Education" },
  { id: "28", label: "Science & Tech" },
];

// Privacy status options
export const PRIVACY_OPTIONS: PrivacyOption[] = [
  { value: "private", label: "Private (only you)" },
  { value: "unlisted", label: "Unlisted (link only)" },
  { value: "public", label: "Public (anyone can find)" },
];

// File size limits
export const MAX_AUDIO_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
export const MAX_IMAGE_SIZE = 500 * 1024 * 1024; // 500MB

// Accepted MIME types
export const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/aac",
];

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];