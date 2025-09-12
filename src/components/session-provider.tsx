'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

// Thin wrapper around next-auth's SessionProvider so we can add app-level
// session behaviors or UI later without changing callers.
export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}