import { verifyPassword } from "@/lib/password";

type AppRole = "ADMIN" | "USER";

type CredentialsInput = {
  email?: unknown;
  password?: unknown;
};

type DbUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: AppRole;
  passwordHash: string | null;
};

type CredentialsDependencies = {
  findUserByEmail: (email: string) => Promise<DbUser | undefined>;
  verifyPassword: (password: string, passwordHash: string) => Promise<boolean>;
};

async function resolveDefaultDependencies(): Promise<CredentialsDependencies> {
  const { db } = await import("@/src/db/client");

  return {
    findUserByEmail: async (email) => {
      return db.query.users.findFirst({
        where: (table, { eq }) => eq(table.email, email),
      });
    },
    verifyPassword,
  };
}

export async function authorizeCredentials(
  credentials: CredentialsInput | undefined,
  dependencies?: CredentialsDependencies,
) {
  const email = credentials?.email;
  const password = credentials?.password;

  if (typeof email !== "string" || typeof password !== "string") {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const resolvedDependencies = dependencies ?? (await resolveDefaultDependencies());
  const user = await resolvedDependencies.findUserByEmail(normalizedEmail);

  if (!user?.passwordHash) {
    return null;
  }

  const isValidPassword = await resolvedDependencies.verifyPassword(password, user.passwordHash);
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
}
