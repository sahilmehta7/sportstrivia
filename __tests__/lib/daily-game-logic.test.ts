import { createDailyReferralTag, generateShareableGrid, type LetterResult } from '@/lib/utils/daily-game-logic';

describe('daily-game-logic sharing', () => {
  const sampleGuesses: LetterResult[][] = [
    [
      { letter: 'S', status: 'correct' },
      { letter: 'C', status: 'present' },
      { letter: 'O', status: 'absent' },
      { letter: 'R', status: 'correct' },
      { letter: 'E', status: 'correct' },
    ],
  ];

  it('includes custom challenge URL with referral/utm params', () => {
    const shareUrl = 'https://sportstrivia.com/daily?challenge=123&score=4&ref=abc123&utm_source=daily_share&utm_medium=app&utm_campaign=daily_word';

    const text = generateShareableGrid(123, sampleGuesses, true, 6, shareUrl);

    expect(text).toContain('SportsTrivia Daily #123 1/6');
    expect(text).toContain('🟩🟨⬛🟩🟩');
    expect(text).toContain(shareUrl);
  });

  it('generates deterministic referral tags from user ID', () => {
    const first = createDailyReferralTag('user_abc_123');
    const second = createDailyReferralTag('user_abc_123');
    const different = createDailyReferralTag('user_xyz_999');

    expect(first).toBe(second);
    expect(first).not.toBe(different);
    expect(first.length).toBeGreaterThan(0);
  });
});
