import { pointsForLevel, roundPoints } from "@/lib/config/gamification";

describe("gamification curve", () => {
  it("rounds to nearest 100 below 10k", () => {
    expect(roundPoints(149)).toBe(100);
    expect(roundPoints(151)).toBe(200);
    expect(roundPoints(9950)).toBe(10000);
  });

  it("rounds to nearest 1000 at or above 10k", () => {
    expect(roundPoints(10049)).toBe(10000);
    expect(roundPoints(10050)).toBe(10000);
    expect(roundPoints(14999)).toBe(15000);
  });

  it("is quadratic increasing with level 1 around 100 after rounding", () => {
    const l1 = pointsForLevel(1);
    const l2 = pointsForLevel(2);
    const l10 = pointsForLevel(10);
    expect(l1).toBeGreaterThanOrEqual(100);
    expect(l2).toBeGreaterThan(l1);
    expect(l10).toBeGreaterThan(l2);
  });
});


