import { seedTestUsers } from "@/src/testing/test-users";

async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    return;
  }

  try {
    await seedTestUsers();
  } catch (error) {
    console.warn("Failed to seed test users for e2e tests.", error);
  }
}

export default globalSetup;
