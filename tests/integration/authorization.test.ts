import { describe, expect, it } from "vitest";

import {
  canAccessAdminArea,
  canAccessDataEntryWorkspace,
  canEditOwnProfile,
  canManageSystemSettings,
  canManageUsers,
  canViewDashboard,
  canViewReports,
  forbidUnless,
  hasRole,
  isAdmin,
} from "@/lib/authorization";

describe("authorization helpers", () => {
  it("evaluates role hierarchy via hasRole", () => {
    expect(hasRole("ADMIN", "USER")).toBe(true);
    expect(hasRole("MANAGER", "USER")).toBe(true);
    expect(hasRole("ADMIN", "MANAGER")).toBe(true);
    expect(hasRole("USER", "ADMIN")).toBe(false);
    expect(hasRole(undefined, "USER")).toBe(false);
  });

  it("detects admin role", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("USER")).toBe(false);
  });

  it("checks business action permissions", () => {
    expect(canViewDashboard("USER")).toBe(true);
    expect(canEditOwnProfile("USER")).toBe(true);
    expect(canAccessDataEntryWorkspace("USER")).toBe(true);
    expect(canViewReports("USER")).toBe(false);
    expect(canAccessAdminArea("USER")).toBe(false);

    expect(canViewReports("MANAGER")).toBe(true);
    expect(canManageUsers("MANAGER")).toBe(false);
    expect(canAccessAdminArea("MANAGER")).toBe(true);
    expect(canViewReports("ADMIN")).toBe(true);
    expect(canManageUsers("ADMIN")).toBe(true);
    expect(canManageSystemSettings("ADMIN")).toBe(true);
  });

  it("throws when forbidUnless condition is false", () => {
    expect(() => forbidUnless(true, "ok")).not.toThrow();

    expect(() => forbidUnless(false, "No access")).toThrowError("No access");
  });
});
