import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const allowedPlannerEmails = parseAllowedEmails(
  process.env.TASKTRAIL_ALLOWED_EMAILS ?? process.env.TASKTRAIL_OWNER_EMAIL,
);

if (!googleClientId || !googleClientSecret) {
  console.warn("Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
}

export const authOptions: NextAuthOptions = {
  providers:
    googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : [],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    signIn({ user }) {
      return isAllowedPlannerEmail(user.email);
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

export function isAllowedPlannerEmail(email?: string | null) {
  if (!email) return false;
  if (allowedPlannerEmails.size === 0) return true;
  return allowedPlannerEmails.has(normalizeEmail(email));
}

function parseAllowedEmails(value?: string) {
  return new Set(
    (value ?? "")
      .split(/[\s,;]+/)
      .map(normalizeEmail)
      .filter(Boolean),
  );
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
