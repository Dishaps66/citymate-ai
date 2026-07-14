import { describe, expect, it } from "vitest";
import { features } from "@/lib/features";

describe("features", () => {
  it("includes emergency and transparency modules", () => {
    expect(features.some((feature) => feature.slug === "emergency")).toBe(true);
    expect(features.some((feature) => feature.slug === "transparency")).toBe(true);
  });
});
