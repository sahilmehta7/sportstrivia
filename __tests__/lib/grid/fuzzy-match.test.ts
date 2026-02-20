import { normalizeAnswer, jaroWinklerSimilarity, findBestMatch } from '@/lib/grid/fuzzy-match';

describe('normalizeAnswer', () => {
    it('trims and lowercases', () => {
        expect(normalizeAnswer('  Virat Kohli  ')).toBe('virat kohli');
    });

    it('collapses internal whitespace', () => {
        expect(normalizeAnswer('MS   Dhoni')).toBe('ms dhoni');
    });

    it('strips punctuation', () => {
        expect(normalizeAnswer("O'Brien-Smith")).toBe('obriensmith');
    });

    it('removes diacritics', () => {
        expect(normalizeAnswer('André Müller')).toBe('andre muller');
    });

    it('handles empty string', () => {
        expect(normalizeAnswer('')).toBe('');
    });
});

describe('jaroWinklerSimilarity', () => {
    it('returns 1 for identical strings', () => {
        expect(jaroWinklerSimilarity('kohli', 'kohli')).toBe(1);
    });

    it('returns 0 for completely different strings', () => {
        expect(jaroWinklerSimilarity('abc', 'xyz')).toBe(0);
    });

    it('returns high similarity for minor misspellings', () => {
        const sim = jaroWinklerSimilarity('sachin tendulkar', 'sachin tendulker');
        expect(sim).toBeGreaterThan(0.95);
    });

    it('returns moderate similarity for partial matches', () => {
        const sim = jaroWinklerSimilarity('virat', 'viral');
        expect(sim).toBeGreaterThan(0.8);
        expect(sim).toBeLessThan(1);
    });
});

describe('findBestMatch', () => {
    const accepted = [
        { id: '1', text: 'Sachin Tendulkar' },
        { id: '2', text: 'Virat Kohli' },
        { id: '3', text: 'MS Dhoni' },
    ];

    it('matches exact input', () => {
        const result = findBestMatch('Sachin Tendulkar', accepted);
        expect(result.matched).toBe(true);
        if (result.matched) {
            expect(result.answerId).toBe('1');
        }
    });

    it('matches with minor misspelling', () => {
        const result = findBestMatch('Sachin Tendulker', accepted);
        expect(result.matched).toBe(true);
        if (result.matched) {
            expect(result.answerId).toBe('1');
        }
    });

    it('matches case-insensitive', () => {
        const result = findBestMatch('virat kohli', accepted);
        expect(result.matched).toBe(true);
        if (result.matched) {
            expect(result.answerId).toBe('2');
        }
    });

    it('rejects clearly wrong answers', () => {
        const result = findBestMatch('Steve Smith', accepted);
        expect(result.matched).toBe(false);
    });

    it('rejects too-short input', () => {
        const result = findBestMatch('AB', accepted);
        expect(result.matched).toBe(false);
    });

    it('respects configurable threshold', () => {
        // Very strict threshold
        const result = findBestMatch('Sachin Tendulker', accepted, 0.99);
        expect(result.matched).toBe(false);
    });

    it('handles empty accepted list', () => {
        const result = findBestMatch('test', []);
        expect(result.matched).toBe(false);
    });
});
