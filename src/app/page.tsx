"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  FileVideo,
  LogIn,
  Sparkles,
  Youtube,
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import MetadataForm from "@/components/MetadataForm";
import VideoPreview from "@/components/VideoPreview";
import ProgressBar from "@/components/ProgressBar";
import type {
  ApiError,
  GenerateResponse,
  UploadResponse,
  VideoMetadata,
} from "@/types";

const initialMetadata: VideoMetadata = {
  title: "",
  description: "",
  tags: [],
  categoryId: "10",
  privacyStatus: "unlisted",
};

export default function HomePage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata>(initialMetadata);
  const [generated, setGenerated] = useState<GenerateResponse | null>(null);
  const [uploaded, setUploaded] = useState<UploadResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    if (!audioFile || !imageFile)
      return setError("Please select both an audio file and an image.");
    setBusy(true);
    setBusyMessage("Generating video...");
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("image", imageFile);
      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = (await res.json()) as ApiError;
        throw new Error(data.error || "Video generation failed.");
      }
      setGenerated((await res.json()) as GenerateResponse);
      setUploaded(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async () => {
    setError(null);
    if (!generated) return;
    if (!metadata.title.trim())
      return setError("Please enter a video title before uploading.");
    setBusy(true);
    setBusyMessage("Uploading to YouTube...");
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoPath: generated.videoPath, metadata }),
      });
      if (!res.ok) {
        const data = (await res.json()) as ApiError;
        throw new Error(data.error || "Upload failed.");
      }
      setUploaded((await res.json()) as UploadResponse);
      setGenerated(null);
      setAudioFile(null);
      setImageFile(null);
      setMetadata(initialMetadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const steps = [
    {
      label: "Add source files",
      detail: audioFile && imageFile ? "Files attached" : "Audio + cover art",
      active: true,
    },
    {
      label: "Review video",
      detail: generated ? "Render ready" : "Generate to unlock",
      active: !!generated,
    },
    {
      label: "Publish to YouTube",
      detail: "Add your video details",
      active: !!generated && !!metadata.title.trim(),
    },
  ];

  // ---------------- NOT AUTHENTICATED: card on top, goal.jpg below (scroll) ----------------
  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-12 md:py-16">
        {/* Connect to Google card — on top */}
        <div className="rounded-2xl p-8 md:p-10 text-center max-w-lg w-full mx-auto bg-dark-900/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-accent-blue grid place-items-center mx-auto mb-5 shadow-xl shadow-accent-blue/20">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-light mb-2">
            Ready when you are.
          </h2>
          <p className="text-dark-600 mb-7 leading-relaxed">
            Connect your Google account to create videos and publish directly to
            YouTube.
          </p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="inline-flex items-center gap-2 bg-light hover:bg-white text-dark-950 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-white/10"
          >
            Connect YouTube <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scroll hint */}
        <p className="text-center text-dark-600 text-xs mt-10 uppercase tracking-[0.18em]">
          Scroll down ↓
        </p>

        {/* goal.jpg — below, visible on scroll */}
        <section className="relative overflow-hidden rounded-2xl mt-10 border border-white/10 shadow-2xl shadow-black/40">
          <img
            src="/goal.jpg"
            alt="Your goal"
            className="w-full h-auto object-cover max-h-[80vh]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <p className="text-xs uppercase tracking-[0.18em] text-violet-200/90 font-semibold mb-2 drop-shadow-lg">
              The reason you create
            </p>
            <p className="text-2xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
              Tynachoebi Garadokidan
            </p>
          </div>
        </section>
      </div>
    );
  }

  // ---------------- AUTHENTICATED: normal studio layout ----------------
  return (
    <div className="max-w-7xl mx-auto px-5 py-10 md:py-14">
      <GoalCard />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_285px] gap-6">
        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-accent-red/10 border border-accent-red/50 text-red-300 rounded-xl px-4 py-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {uploaded && (
            <div className="bg-emerald-500/[0.08] border border-emerald-400/30 rounded-2xl p-7 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-light mb-1">
                Your video is live.
              </h2>
              <p className="text-dark-600 mb-4">
                &quot;{uploaded.title}&quot; is now on YouTube.
              </p>
              <a
                href={uploaded.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-accent-red hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
              >
                <Youtube className="w-5 h-5" /> View on YouTube
              </a>
            </div>
          )}
          <section className="studio-card rounded-2xl p-5 md:p-7">
            <SectionTitle
              number="01"
              title="Source files"
              description="Add your audio track and artwork."
              icon
            />
            <FileUpload
              audioFile={audioFile}
              imageFile={imageFile}
              onAudioChange={setAudioFile}
              onImageChange={setImageFile}
              disabled={busy}
            />
            <button
              onClick={handleGenerate}
              disabled={busy || !audioFile || !imageFile}
              className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-accent-blue to-violet-500 hover:brightness-110 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-accent-blue/15 disabled:opacity-40 disabled:shadow-none"
            >
              <Sparkles className="w-5 h-5" /> Generate video
            </button>
          </section>
          {generated && (
            <>
              <section className="studio-card rounded-2xl p-5 md:p-7">
                <SectionTitle
                  number="02"
                  title="Review render"
                  description="Check your video before it goes live."
                />
                <VideoPreview src={generated.videoUrl} />
              </section>
              <section className="studio-card rounded-2xl p-5 md:p-7">
                <SectionTitle
                  number="03"
                  title="Publish settings"
                  description="Give your video the details it deserves."
                />
                <MetadataForm
                  metadata={metadata}
                  onChange={setMetadata}
                  disabled={busy}
                />
                <button
                  onClick={handleUpload}
                  disabled={busy || !metadata.title.trim()}
                  className="mt-6 inline-flex items-center gap-2 bg-accent-red hover:bg-rose-500 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-rose-900/20 disabled:opacity-40 disabled:shadow-none"
                >
                  <Youtube className="w-5 h-5" /> Upload to YouTube
                </button>
              </section>
            </>
          )}
        </div>
        <aside className="studio-card rounded-2xl p-5 h-fit xl:sticky xl:top-24">
          <p className="text-xs uppercase tracking-[0.16em] text-dark-600 font-semibold">
            Upload flow
          </p>
          <div className="mt-5 space-y-5">
            {steps.map((step, index) => (
              <div className="flex gap-3" key={step.label}>
                <span
                  className={`mt-0.5 w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold border ${
                    step.active
                      ? "bg-violet-400/15 border-violet-300/40 text-violet-200"
                      : "border-white/10 text-dark-600"
                  }`}
                >
                  {index + 1}
                </span>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      step.active ? "text-light" : "text-dark-600"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-dark-600 mt-0.5">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-7 pt-5 border-t border-white/[0.07] text-xs text-dark-600 leading-relaxed">
            Your files stay in this workspace while your video is being prepared.
          </p>
        </aside>
      </div>

      <div className="text-center mt-8">
        <Link
          href="/auth"
          className="text-dark-600 hover:text-violet-300 text-sm transition-colors"
        >
          Manage connected account →
        </Link>
      </div>

      {busy && <ProgressBar message={busyMessage} />}
    </div>
  );
}

function SectionTitle({
  number,
  title,
  description,
  icon = false,
}: {
  number: string;
  title: string;
  description: string;
  icon?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex gap-3">
        <span className="w-8 h-8 rounded-lg bg-violet-400/10 text-violet-300 grid place-items-center text-sm font-bold">
          {number}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-light">{title}</h2>
          <p className="text-dark-600 text-sm mt-0.5">{description}</p>
        </div>
      </div>
      {icon && <FileVideo className="w-5 h-5 text-dark-600" />}
    </div>
  );
}

function GoalCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl min-h-64 md:min-h-80 mb-8 border border-white/[0.10] bg-dark-800 shadow-2xl shadow-black/30">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-90"
        style={{ backgroundImage: "url('/goal.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
      <div className="relative flex min-h-64 md:min-h-80 items-end p-6 md:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-violet-200/90 font-semibold mb-2 drop-shadow-lg">
            The reason you create
          </p>
          <p className="text-2xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
            Tynachoebi Garadokidan
          </p>
        </div>
      </div>
    </section>
  );
}