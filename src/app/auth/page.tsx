"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { CheckCircle, Loader2, Youtube, LogOut } from "lucide-react";
import { getInitials } from "@/lib/utils";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Optional redirect could go here; we keep the user on the account page
  useEffect(() => {
    // no-op: allow staying on the auth page to view account status
  }, [status, router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 py-10">
      <div className="studio-card rounded-2xl p-8 md:p-10 max-w-md w-full">
        {status === "loading" ? (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 text-violet-300 animate-spin mx-auto" />
            <p className="text-dark-600 mt-4">Loading...</p>
          </div>
        ) : status === "authenticated" ? (
          <div className="text-center">
            <div className="w-14 h-14 grid place-items-center rounded-2xl bg-emerald-400/10 mx-auto mb-4"><CheckCircle className="w-7 h-7 text-emerald-400" /></div>
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-300 font-semibold mb-2">Account connected</p>
            <h1 className="text-2xl font-bold text-light mb-2">You&apos;re ready to publish.</h1>
            <p className="text-dark-600 mb-6">
              Your YouTube account is connected and ready.
            </p>

            <div className="flex items-center gap-3 bg-dark-900/70 border border-white/[0.07] rounded-xl p-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-accent-blue flex items-center justify-center text-white font-semibold flex-shrink-0">
                {getInitials(session?.user?.name)}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-light font-medium truncate">
                  {session?.user?.name}
                </p>
                <p className="text-dark-600 text-sm truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push("/")}
                className="w-full bg-gradient-to-r from-accent-blue to-violet-500 hover:brightness-110 text-white px-5 py-3 rounded-xl font-semibold transition-all"
              >
                Go to Video Generator
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] text-light px-5 py-3 rounded-xl font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent-red/15 flex items-center justify-center mx-auto mb-4">
              <Youtube className="w-7 h-7 text-accent-red" />
            </div>
            <h1 className="text-2xl font-bold text-light mb-2">
              Connect your YouTube
            </h1>
            <p className="text-dark-600 mb-6">
              Sign in with Google to grant permission to upload videos to your
              YouTube channel. We only request the access needed to upload.
            </p>
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full bg-light hover:bg-white text-dark-950 px-5 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-white/10"
            >
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
