import { describe, expect, it, vi } from "vitest";

import { authorizeCredentials } from "@/src/auth/credentials";

describe("authorizeCredentials", () => {
  it("normalizes email and returns user payload on valid credentials", async () => {
    const findUserByEmail = vi.fn().mockResolvedValue({
      id: "user_1",
      email: "person@example.com",
      name: "Person",
      image: null,
      role: "ADMIN",
      passwordHash: "hashed",
    });
    const verifyPassword = vi.fn().mockResolvedValue(true);

    const result = await authorizeCredentials(
      { email: "  PERSON@EXAMPLE.COM ", password: "correct horse battery staple" },
      { findUserByEmail, verifyPassword },
    );

    expect(findUserByEmail).toHaveBeenCalledWith("person@example.com");
    expect(verifyPassword).toHaveBeenCalledWith("correct horse battery staple", "hashed");
    expect(result).toEqual({
      id: "user_1",
      email: "person@example.com",
      name: "Person",
      image: null,
      role: "ADMIN",
    });
  });

  it("returns null for missing credentials payload", async () => {
    const result = await authorizeCredentials(undefined, {
      findUserByEmail: vi.fn(),
      verifyPassword: vi.fn(),
    });

    expect(result).toBeNull();
  });

  it("returns null when user has no password hash", async () => {
    const verifyPassword = vi.fn();

    const result = await authorizeCredentials(
      { email: "person@example.com", password: "password" },
      {
        findUserByEmail: vi.fn().mockResolvedValue({
          id: "user_2",
          email: "person@example.com",
          name: null,
          image: null,
          role: "USER",
          passwordHash: null,
        }),
        verifyPassword,
      },
    );

    expect(verifyPassword).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("returns null when password verification fails", async () => {
    const result = await authorizeCredentials(
      { email: "person@example.com", password: "wrong" },
      {
        findUserByEmail: vi.fn().mockResolvedValue({
          id: "user_3",
          email: "person@example.com",
          name: null,
          image: null,
          role: "USER",
          passwordHash: "hashed",
        }),
        verifyPassword: vi.fn().mockResolvedValue(false),
      },
    );

    expect(result).toBeNull();
  });
});
