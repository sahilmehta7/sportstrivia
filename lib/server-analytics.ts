import type { PersonalizedHomeVariant, PersonalizedHomeRailKind } from "@/types/personalized-home";

export type PersonalizedHomeExposureEvent = {
  userId: string;
  variant: PersonalizedHomeVariant;
  bucket: number;
  renderedModuleKinds: string[];
  renderedRailKinds: PersonalizedHomeRailKind[];
};

export async function emitPersonalizedHomeExposure(event: PersonalizedHomeExposureEvent): Promise<void> {
  try {
    console.info("[analytics] personalized_home_exposure", {
      ...event,
      occurredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[analytics] failed to emit personalized_home_exposure", error);
  }
}
