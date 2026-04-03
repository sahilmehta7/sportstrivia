import { getPersonalizedHomeBucket, getPersonalizedHomeVariantForUser } from "@/lib/personalized-home-experiment";

jest.mock("@/lib/feature-flags", () => ({
  isPersonalizedHomeExperimentEnabled: jest.fn(),
}));

const { isPersonalizedHomeExperimentEnabled } = jest.requireMock("@/lib/feature-flags") as {
  isPersonalizedHomeExperimentEnabled: jest.Mock;
};

describe("personalized-home experiment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns treatment when experiment is disabled", () => {
    isPersonalizedHomeExperimentEnabled.mockReturnValue(false);

    expect(getPersonalizedHomeVariantForUser("user_123")).toBe("treatment");
  });

  it("returns deterministic bucket and variant when experiment is enabled", () => {
    isPersonalizedHomeExperimentEnabled.mockReturnValue(true);

    const userId = "user_abc";
    const bucketA = getPersonalizedHomeBucket(userId);
    const bucketB = getPersonalizedHomeBucket(userId);

    expect(bucketA).toBe(bucketB);
    expect(bucketA).toBeGreaterThanOrEqual(0);
    expect(bucketA).toBeLessThan(100);

    const variant = getPersonalizedHomeVariantForUser(userId);
    expect(["control", "treatment"]).toContain(variant);

    if (bucketA < 50) {
      expect(variant).toBe("control");
    } else {
      expect(variant).toBe("treatment");
    }
  });
});
