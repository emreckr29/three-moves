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

  it('counts participation separately from Perfect days and UTC Perfect streaks', () => {
    const perfect = recordAttempt(recordAttempt(null, 8), 0);
    const history = {
      '2026-10-30': perfect,
      '2026-10-31': perfect,
      '2026-11-01': perfect,
      '2026-11-02': recordAttempt(null, 4),
      '2026-11-04': perfect,
    };

    expect(dailyStatistics({}, '2026-11-01')).toEqual({
      daysPlayed: 0,
      perfectDays: 0,
      currentPerfectStreak: 0,
      longestPerfectStreak: 0,
    });
    expect(dailyStatistics(history, '2026-11-02')).toEqual({
      daysPlayed: 4,
      perfectDays: 3,
      currentPerfectStreak: 3,
      longestPerfectStreak: 3,
    });
    expect(dailyStatistics(history, '2026-11-03').currentPerfectStreak).toBe(0);
    expect(dailyStatistics(history, '2026-11-04')).toEqual({
      daysPlayed: 5,
      perfectDays: 4,
      currentPerfectStreak: 1,
      longestPerfectStreak: 3,
    });
  });

  it('shares lights remaining and celebrates Perfect with the attempt count', () => {
    const date = '2026-11-19';
    const first = recordAttempt(null, 8);
    expect(shareText(date, first)).toBe(
      'Three Moves — 2026-11-19 UTC\nFirst attempt: 8/16 lights remaining\nBest score: 8/16 lights remaining',
    );
    expect(shareText(date, recordAttempt(first, 0))).toBe(
      'Three Moves — 2026-11-19 UTC\nFirst attempt: 8/16 lights remaining\nBest score: 0/16 lights remaining — Perfect!\nReached in 2 attempts',
    );
  });
});
