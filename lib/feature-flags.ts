export function isPersonalizedHomeEnabled() {
  return process.env.ENABLE_PERSONALIZED_HOME === "true";
}

export function isRecommendationProfileInputEnabled() {
  return process.env.ENABLE_RECOMMENDATION_PROFILE_INPUT === "true";
}

export function isSearchProfileBiasEnabled() {
  return process.env.ENABLE_SEARCH_PROFILE_BIAS === "true";
}
