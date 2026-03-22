export interface QuizQueryUpdateInput {
  set?: Record<string, string | undefined>;
  remove?: string[];
  resetPage?: boolean;
}

export function buildQuizzesPath(
  currentSearchParams: URLSearchParams,
  input: QuizQueryUpdateInput
): string {
  const params = new URLSearchParams(currentSearchParams.toString());

  for (const key of input.remove ?? []) {
    params.delete(key);
  }

  for (const [key, value] of Object.entries(input.set ?? {})) {
    if (!value) {
      params.delete(key);
      continue;
    }
    params.set(key, value);
  }

  if (input.resetPage !== false) {
    params.delete("page");
  }

  const queryString = params.toString();
  return queryString ? `/quizzes?${queryString}` : "/quizzes";
}
