import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

import { verifyPassword } from "@/lib/password";
import { db } from "@/src/db/client";
import { accounts, sessions, users, verificationTokens } from "@/src/db/schema";

type AppRole = "ADMIN" | "USER";

const credentialsProvider = Credentials({
  name: "Email and Password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const email = credentials?.email;
    const password = credentials?.password;

    if (typeof email !== "string" || typeof password !== "string") {
      return null;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return null;
    }

    const user = await db.query.users.findFirst({
      where: (table, { eq }) => eq(table.email, normalizedEmail),
    });

    if (!user?.passwordHash) {
      return null;
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
    };
  },
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
