import { Client } from "pg";

import { seedTestUsers } from "@/src/testing/test-users";

function missingPrerequisites() {
  const missing: string[] = [];

  if (!process.env.DATABASE_URL) {
    missing.push("DATABASE_URL");
  }

  if (!process.env.AUTH_SECRET) {
    missing.push("AUTH_SECRET");
  }

  if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
    missing.push("AUTH_URL or NEXTAUTH_URL");
  }

  if (process.env.EMAIL_PROVIDER === "resend") {
    if (!process.env.RESEND_API_KEY) {
      missing.push("RESEND_API_KEY");
    }

    if (!process.env.EMAIL_FROM) {
      missing.push("EMAIL_FROM");
    }
  }

  return missing;
}

async function verifyDatabaseReachability() {
  if (!process.env.DATABASE_URL) {
    return false;
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    await client.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function globalSetup() {
  const isCi = process.env.CI === "true";
  const missing = missingPrerequisites();

  if (missing.length > 0) {
    const message = `Missing e2e prerequisites: ${missing.join(", ")}`;

    if (isCi) {
      throw new Error(message);
    }

    console.warn(`${message}. Skipping e2e seed in local mode.`);
    return;
  }

  const canReachDatabase = await verifyDatabaseReachability();

  if (!canReachDatabase) {
    const message = "Postgres is not reachable with the configured DATABASE_URL.";

    if (isCi) {
      throw new Error(message);
    }

    console.warn(`${message} Skipping e2e seed in local mode.`);
    return;
  }

  try {
    await seedTestUsers();
  } catch (error) {
    if (isCi) {
      throw error;
    }

    console.warn("Failed to seed test users for e2e tests.", error);
  }
}

export default globalSetup;
