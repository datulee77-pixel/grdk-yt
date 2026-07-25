"use client";

import { Loader2 } from "lucide-react";

interface ProgressBarProps {
  message: string;
  progress?: number;
}

export default function ProgressBar({ message, progress }: ProgressBarProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-8 max-w-sm w-full mx-4 text-center">
        <Loader2 className="w-12 h-12 text-accent-blue animate-spin mx-auto mb-4" />
        <p className="text-light font-medium mb-2">{message}</p>

        {typeof progress === "number" && (
          <div className="w-full bg-dark-900 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className="bg-accent-blue h-2 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}

        <p className="text-dark-600 text-xs mt-2">
          Please don&apos;t close this window.
        </p>
      </div>
    </div>
  );
}