"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Clapperboard, Menu, X, LogIn, LogOut } from "lucide-react";
import { getInitials } from "@/lib/utils";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = status === "authenticated";

  return (
    <nav className="bg-dark-900/80 border-b border-white/[0.07] sticky top-0 z-40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex items-center justify-between h-[4.5rem]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 text-light font-bold tracking-tight">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-violet-400 shadow-lg shadow-accent-blue/20">
              <Clapperboard className="w-5 h-5 text-white" />
            </span>
            <span className="text-lg">Studio<span className="text-violet-300">Flow</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            <Link href="/" className="text-sm text-light hover:text-violet-300 transition-colors">
              Uploads
            </Link>
            {isAuthenticated && (
              <Link
                href="/auth"
                className="text-sm text-dark-600 hover:text-violet-300 transition-colors"
              >
                Account
              </Link>
            )}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 border-l border-white/[0.08] pl-5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-accent-blue flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(session?.user?.name)}
                  </div>
                  <span className="text-light text-sm max-w-28 truncate">{session?.user?.name}</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1.5 text-dark-600 hover:text-light px-1 text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex items-center gap-2 bg-light hover:bg-white text-dark-950 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-white/10"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-light p-2 -mr-2"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-white/[0.07]">
            <Link
              href="/"
              className="block text-light hover:text-violet-300"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            {isAuthenticated && (
              <Link
                href="/auth"
                className="block text-light hover:text-violet-300"
                onClick={() => setMobileOpen(false)}
              >
                Account
              </Link>
            )}
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center text-white text-sm font-semibold">
                    {getInitials(session?.user?.name)}
                  </div>
                  <span className="text-light text-sm">{session?.user?.name}</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1 bg-dark-700 hover:bg-dark-600 text-light px-3 py-2.5 rounded-lg text-sm w-full justify-center"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex items-center gap-1 bg-light text-dark-950 px-4 py-2.5 rounded-lg text-sm w-full justify-center font-semibold"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
