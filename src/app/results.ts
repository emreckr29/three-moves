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
  const played = Object.keys(history).filter((date) => date <= today && history[date]);
  const perfect = played.filter((date) => history[date]?.best === 0).sort();
  let previousPerfect = -Infinity;
  let streak = 0;
  let longestPerfectStreak = 0;

  for (const date of perfect) {
    const day = Date.parse(date);
    streak = day - previousPerfect === DAY_MS ? streak + 1 : 1;
    longestPerfectStreak = Math.max(longestPerfectStreak, streak);
    previousPerfect = day;
  }

  return {
    daysPlayed: played.length,
    perfectDays: perfect.length,
    currentPerfectStreak: Date.parse(today) - previousPerfect <= DAY_MS ? streak : 0,
    longestPerfectStreak,
  };
}

export function shareText(date: string, result: DailyResult): string {
  const lightCount = BOARD_SIZE ** 2;
  const perfect = result.best === 0;
  const lines = [
    `Three Moves — ${date} UTC`,
    `First attempt: ${result.first}/${lightCount} lights remaining`,
    `Best score: ${result.best}/${lightCount} lights remaining${perfect ? ' — Perfect!' : ''}`,
  ];

  if (perfect) {
    lines.push(`Reached in ${result.attempts} ${result.attempts === 1 ? 'attempt' : 'attempts'}`);
  }

  return lines.join('\n');
}
