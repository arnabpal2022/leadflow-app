import { NextAuthOptions, DefaultSession } from 'next-auth';
// Extend the session user type to include id and role
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}
import { DrizzleAdapter } from '@auth/drizzle-adapter';
// Next.js runtime can require the .js extension for ESM package exports at runtime
// in some bundler/runtime configurations (Next 13+/15+). Use the explicit .js
// import to avoid "Module not found" errors when running server code.
import EmailProvider from 'next-auth/providers/email';
import { db } from './db';
import { users, accounts, sessions, verificationTokens } from './db/schema';

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = String(token.id);
        session.user.role = typeof token.role === 'string' ? token.role : 'user';
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // db can be a libsql client or better-sqlite3 drizzle instance; cast to any
        // for lookup in this callback to avoid complex typing here.
        const dbAny = db as any;
        const dbUser = await dbAny.query.users.findFirst({
          where: (users: any, { eq }: any) => eq(users.id, user.id),
        });
        token.role = dbUser?.role || 'user';
      }
      return token;
    },
  },
};