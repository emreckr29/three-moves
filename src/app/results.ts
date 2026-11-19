import { BOARD_SIZE } from './game';

const DAY_MS = 86_400_000;

export interface DailyResult {
  readonly first: number;
  readonly best: number;
  readonly attempts: number;
}

export type ResultHistory = Readonly<Partial<Record<string, DailyResult>>>;

export function recordAttempt(previous: DailyResult | null, lights: number): DailyResult {
  if (previous?.best === 0) return previous;

  return {
    first: previous?.first ?? lights,
    best: Math.min(previous?.best ?? lights, lights),
    attempts: (previous?.attempts ?? 0) + 1,
  };
}

export function dailyStatistics(history: ResultHistory, today: string) {
  const completed = Object.keys(history).filter((date) => date <= today && history[date]);
  const wins = completed.filter((date) => history[date]?.best === 0).sort();
  let previousWin = -Infinity;
  let streak = 0;
  let longestStreak = 0;

  for (const date of wins) {
    const day = Date.parse(date);
    streak = day - previousWin === DAY_MS ? streak + 1 : 1;
    longestStreak = Math.max(longestStreak, streak);
    previousWin = day;
  }

  return {
    completedChallenges: completed.length,
    currentStreak: Date.parse(today) - previousWin <= DAY_MS ? streak : 0,
    longestStreak,
  };
}

export function shareText(date: string, result: DailyResult): string {
  const lightCount = BOARD_SIZE ** 2;
  const lines = [
    `Three Moves — ${date} UTC`,
    `First attempt: ${result.first}/${lightCount} lights left`,
    `Best result: ${result.best}/${lightCount} lights left`,
  ];

  if (result.best === 0) {
    lines.push(`Solved in ${result.attempts} ${result.attempts === 1 ? 'attempt' : 'attempts'}`);
  }

  return lines.join('\n');
}
