import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

import { authorizeCredentials } from "@/src/auth/credentials";
import { db } from "@/src/db/client";
import { accounts, sessions, users, verificationTokens } from "@/src/db/schema";

type AppRole = "ADMIN" | "USER";

const credentialsProvider = Credentials({
  name: "Email and Password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  authorize: authorizeCredentials,
});

const githubProvider =
  process.env.GITHUB_ID && process.env.GITHUB_SECRET
    ? [
        GitHub({
          clientId: process.env.GITHUB_ID,
          clientSecret: process.env.GITHUB_SECRET,
        }),
      ]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "database",
  },
  providers: [credentialsProvider, ...githubProvider],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role?: AppRole }).role ?? "USER";
      }

      return token;
    },
    async session({ session, token, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user.role as AppRole | undefined) ?? (token.role as AppRole | undefined) ?? "USER";
      }

      return session;
    },
  },
});
