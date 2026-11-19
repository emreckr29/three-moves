import { describe, expect, it } from 'vitest';
import { dailyStatistics, recordAttempt, shareText } from './results';

describe('daily results', () => {
  it('preserves the first score across better and worse retries', () => {
    const first = recordAttempt(null, 8);
    const better = recordAttempt(first, 4);
    const worse = recordAttempt(better, 6);
    const solved = recordAttempt(worse, 0);

    expect(first).toEqual({ first: 8, best: 8, attempts: 1 });
    expect(better).toEqual({ first: 8, best: 4, attempts: 2 });
    expect(worse).toEqual({ first: 8, best: 4, attempts: 3 });
    expect(solved).toEqual({ first: 8, best: 0, attempts: 4 });
    expect(recordAttempt(solved, 0)).toBe(solved);
  });

  it('counts completed dates and UTC win streaks across month boundaries', () => {
    const won = recordAttempt(recordAttempt(null, 8), 0);
    const history = {
      '2026-10-30': won,
      '2026-10-31': won,
      '2026-11-01': won,
      '2026-11-02': recordAttempt(null, 4),
      '2026-11-04': won,
    };

    expect(dailyStatistics({}, '2026-11-01')).toEqual({
      completedChallenges: 0,
      currentStreak: 0,
      longestStreak: 0,
    });
    expect(dailyStatistics(history, '2026-11-02')).toEqual({
      completedChallenges: 4,
      currentStreak: 3,
      longestStreak: 3,
    });
    expect(dailyStatistics(history, '2026-11-03').currentStreak).toBe(0);
    expect(dailyStatistics(history, '2026-11-04')).toEqual({
      completedChallenges: 5,
      currentStreak: 1,
      longestStreak: 3,
    });
  });

  it('formats share text from scores alone and includes attempts only when solved', () => {
    const date = '2026-11-19';
    const first = recordAttempt(null, 8);
    expect(shareText(date, first)).toBe(
      'Three Moves — 2026-11-19 UTC\nFirst attempt: 8/16 lights left\nBest result: 8/16 lights left',
    );
    expect(shareText(date, recordAttempt(first, 0))).toBe(
      'Three Moves — 2026-11-19 UTC\nFirst attempt: 8/16 lights left\nBest result: 0/16 lights left\nSolved in 2 attempts',
    );
  });
});
