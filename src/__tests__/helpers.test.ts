import { describe, expect, it } from "vitest";
import { calculateAccuracy, clamp, formatTime, lerp } from "@/utils/helpers";

describe("helpers", () => {
  it("formats time in mm:ss", () => {
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(9)).toBe("0:09");
  });

  it("calculates accuracy", () => {
    expect(calculateAccuracy(3, 4)).toBe(75);
    expect(calculateAccuracy(0, 0)).toBe(0);
  });

  it("clamps values", () => {
    expect(clamp(10, 0, 5)).toBe(5);
    expect(clamp(-2, 0, 5)).toBe(0);
  });

  it("lerps between values", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});
