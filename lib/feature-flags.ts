export function isPersonalizedHomeEnabled() {
  return process.env.ENABLE_PERSONALIZED_HOME === "true";
}

export function isPersonalizedHomeExperimentEnabled() {
  return process.env.PERSONALIZED_HOME_EXPERIMENT === "true";
}

export function isRecommendationProfileInputEnabled() {
  return process.env.ENABLE_RECOMMENDATION_PROFILE_INPUT === "true";
}

export function isSearchProfileBiasEnabled() {
  return process.env.ENABLE_SEARCH_PROFILE_BIAS === "true";
}

export function isPersonalizedHomePlayStyleBoostEnabled() {
  return process.env.ENABLE_HOME_PLAYSTYLE_BOOST === "true";
}

export function isPersonalizedHomeDiagnosticsEnabled() {
  return process.env.DEBUG_PERSONALIZED_HOME_DIAGNOSTICS === "true";
}
