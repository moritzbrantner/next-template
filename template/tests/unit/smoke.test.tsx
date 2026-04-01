import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import HomePage from "@/app/page";

describe("template smoke", () => {
  test("renders the template landing page", () => {
    render(<HomePage />);

    expect(screen.getByText("{{ project_name }}")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Primary Action" })).toBeTruthy();
  });
});
