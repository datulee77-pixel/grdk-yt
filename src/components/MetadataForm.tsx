"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import {
  CATEGORIES,
  PRIVACY_OPTIONS,
  type VideoMetadata,
  type PrivacyStatus,
} from "@/types";

interface MetadataFormProps {
  metadata: VideoMetadata;
  onChange: (metadata: VideoMetadata) => void;
  disabled?: boolean;
}

const MAX_TITLE = 100;
const MAX_DESCRIPTION = 5000;
const MAX_TAGS = 30;

export default function MetadataForm({
  metadata,
  onChange,
  disabled = false,
}: MetadataFormProps) {
  const [tagInput, setTagInput] = useState("");

  const update = <K extends keyof VideoMetadata>(
    key: K,
    value: VideoMetadata[K]
  ) => {
    onChange({ ...metadata, [key]: value });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (metadata.tags.length >= MAX_TAGS) return;
    if (metadata.tags.includes(tag)) {
      setTagInput("");
      return;
    }
    update("tags", [...metadata.tags, tag]);
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    update(
      "tags",
      metadata.tags.filter((t) => t !== tag)
    );
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-light text-sm font-medium">
            Title <span className="text-accent-red">*</span>
          </label>
          <span className="text-dark-600 text-xs">
            {metadata.title.length}/{MAX_TITLE}
          </span>
        </div>
        <input
          type="text"
          value={metadata.title}
          maxLength={MAX_TITLE}
          disabled={disabled}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Enter video title"
          className="w-full bg-dark-900/70 border border-white/[0.10] rounded-xl px-3.5 py-2.5 text-light placeholder:text-dark-600 focus:border-violet-300/70 focus:ring-4 focus:ring-violet-400/10 focus:outline-none disabled:opacity-50 transition"
        />
      </div>

      {/* Description */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-light text-sm font-medium">Description</label>
          <span className="text-dark-600 text-xs">
            {metadata.description.length}/{MAX_DESCRIPTION}
          </span>
        </div>
        <textarea
          value={metadata.description}
          maxLength={MAX_DESCRIPTION}
          disabled={disabled}
          rows={4}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Enter video description"
          className="w-full bg-dark-900/70 border border-white/[0.10] rounded-xl px-3.5 py-2.5 text-light placeholder:text-dark-600 focus:border-violet-300/70 focus:ring-4 focus:ring-violet-400/10 focus:outline-none resize-y disabled:opacity-50 transition"
        />
      </div>

      {/* Tags */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-light text-sm font-medium">Tags</label>
          <span className="text-dark-600 text-xs">
            {metadata.tags.length}/{MAX_TAGS}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            disabled={disabled || metadata.tags.length >= MAX_TAGS}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag and press Enter"
            className="flex-1 bg-dark-900/70 border border-white/[0.10] rounded-xl px-3.5 py-2.5 text-light placeholder:text-dark-600 focus:border-violet-300/70 focus:ring-4 focus:ring-violet-400/10 focus:outline-none disabled:opacity-50 transition"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={disabled || metadata.tags.length >= MAX_TAGS}
            className="bg-violet-400/15 hover:bg-violet-400/25 text-violet-200 px-3 py-2 rounded-xl disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {metadata.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-violet-400/10 border border-violet-300/10 text-violet-100 text-xs px-2.5 py-1 rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  disabled={disabled}
                  className="hover:text-accent-red"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Category + Privacy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-light text-sm font-medium mb-1 block">Category</label>
          <select
            value={metadata.categoryId}
            disabled={disabled}
            onChange={(e) => update("categoryId", e.target.value)}
            className="w-full bg-dark-900/70 border border-white/[0.10] rounded-xl px-3.5 py-2.5 text-light focus:border-violet-300/70 focus:ring-4 focus:ring-violet-400/10 focus:outline-none disabled:opacity-50 transition"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-light text-sm font-medium mb-1 block">
            Privacy Status
          </label>
          <select
            value={metadata.privacyStatus}
            disabled={disabled}
            onChange={(e) => update("privacyStatus", e.target.value as PrivacyStatus)}
            className="w-full bg-dark-900/70 border border-white/[0.10] rounded-xl px-3.5 py-2.5 text-light focus:border-violet-300/70 focus:ring-4 focus:ring-violet-400/10 focus:outline-none disabled:opacity-50 transition"
          >
            {PRIVACY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
