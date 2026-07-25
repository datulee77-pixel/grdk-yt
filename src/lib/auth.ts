import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Required OAuth scopes for YouTube upload + basic profile
const SCOPES = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

/**
 * Refresh an expired Google access token using the stored refresh token.
 */
async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken?: string; expiresAt?: number; error?: string }> {
  try {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!response.ok || !data.access_token) {
      return { error: "RefreshAccessTokenError" };
    }

    return {
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + (data.expires_in ?? 3600)),
    };
  } catch (error) {
    console.log("Failed to refresh access token:", error);
    return { error: "RefreshAccessTokenError" };
  }
}

const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: SCOPES,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    // Persist the OAuth tokens into the JWT
    async jwt({ token, account }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        return token;
      }

      // Token still valid
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // Token expired — attempt refresh
      if (token.refreshToken) {
        const refreshed = await refreshAccessToken(token.refreshToken);
        if (refreshed.error) {
          token.error = refreshed.error;
        } else {
          token.accessToken = refreshed.accessToken;
          token.expiresAt = refreshed.expiresAt;
          token.error = undefined;
        }
      }

      return token;
    },
    // Expose the access token on the session
    async session({ session, token }) {
      if (session.user) {
        session.user.accessToken = token.accessToken;
      }
      session.error = token.error;
      return session;
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);