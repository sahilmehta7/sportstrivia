/**
 * Fuzzy matching for Immaculate Grid text answers.
 *
 * - Normalizes input (trim, lowercase, strip punctuation/diacritics).
 * - Uses Jaro-Winkler similarity to compare against accepted answers.
 * - No autocomplete / suggestions — server-side validation only.
 */

// ─── Normalization ──────────────────────────────────────────────────────────

/** Remove diacritics / accents (e.g. "ñ" → "n"). */
function removeDiacritics(s: string): string {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Normalize an answer string for comparison. */
export function normalizeAnswer(input: string): string {
    let s = input.trim();
    s = s.replace(/\s+/g, " "); // collapse whitespace
    s = s.toLowerCase();
    s = removeDiacritics(s);
    s = s.replace(/[.,'\-"()]/g, ""); // strip punctuation
    s = s.trim();
    return s;
}

// ─── Jaro-Winkler Similarity ────────────────────────────────────────────────

/**
 * Compute the Jaro similarity between two strings.
 * Returns a value in [0, 1].
 */
function jaroSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array<boolean>(s1.length).fill(false);
    const s2Matches = new Array<boolean>(s2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matching characters
    for (let i = 0; i < s1.length; i++) {
        const start = Math.max(0, i - matchDistance);
        const end = Math.min(i + matchDistance + 1, s2.length);

        for (let j = start; j < end; j++) {
            if (s2Matches[j] || s1[i] !== s2[j]) continue;
            s1Matches[i] = true;
            s2Matches[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) transpositions++;
        k++;
    }

    const jaro =
        (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;

    return jaro;
}

/**
 * Compute Jaro-Winkler similarity (adds prefix bonus to Jaro).
 * Returns a value in [0, 1].
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
    const jaro = jaroSimilarity(s1, s2);

    // Common prefix length (up to 4 chars)
    let prefix = 0;
    const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));
    for (let i = 0; i < maxPrefix; i++) {
        if (s1[i] === s2[i]) {
            prefix++;
        } else {
            break;
        }
    }

    const scalingFactor = 0.1; // standard Winkler scaling
    return jaro + prefix * scalingFactor * (1 - jaro);
}

// ─── Match Finding ──────────────────────────────────────────────────────────

export interface AcceptedAnswer {
    id: string;
    text: string;
}

export interface MatchResult {
    matched: true;
    answerId: string;
    answerText: string;
    similarity: number;
}

export interface NoMatchResult {
    matched: false;
}

/**
 * Find the best fuzzy match for user input against accepted answers.
 *
 * @param input       Raw user-typed string
 * @param accepted    List of accepted answers with id and text
 * @param threshold   Minimum similarity to accept (default: 0.90)
 * @param minLength   Minimum input length (default: 3)
 * @returns           Match result or no-match
 */
export function findBestMatch(
    input: string,
    accepted: AcceptedAnswer[],
    threshold = 0.9,
    minLength = 3
): MatchResult | NoMatchResult {
    const normalizedInput = normalizeAnswer(input);

    if (normalizedInput.length < minLength) {
        return { matched: false };
    }

    let bestSimilarity = 0;
    let bestAnswer: AcceptedAnswer | null = null;

    for (const answer of accepted) {
        const normalizedAccepted = normalizeAnswer(answer.text);
        const similarity = jaroWinklerSimilarity(normalizedInput, normalizedAccepted);

        if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestAnswer = answer;
        }
    }

    if (bestAnswer && bestSimilarity >= threshold) {
        return {
            matched: true,
            answerId: bestAnswer.id,
            answerText: bestAnswer.text,
            similarity: bestSimilarity,
        };
    }

    return { matched: false };
}
