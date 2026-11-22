import { createDailyGame } from './daily-puzzle';
import {
  BOARD_SIZE,
  gameStatus,
  lightsRemaining,
  MOVE_LIMIT,
  playMove,
  type GameState,
  type Move,
} from './game';
import { recordAttempt, type DailyResult, type ResultHistory } from './results';

type SaveKind = 'attempt' | 'win';

export interface DailyProgress {
  readonly game: GameState;
  readonly result: DailyResult | null;
}

export function progressKey(date: string, kind: SaveKind): string {
  return `three-moves:v0.3:${date}:${kind}`;
}

export function loadProgress(date: string): DailyProgress {
  const initial = createDailyGame(date);
  const win =
    readProgress(progressKey(date, 'win'), initial) ??
    readProgress(`three-moves:v0.2:${date}:win`, initial);
  if (win && gameStatus(win.game) === 'perfect') return win;

  return (
    readProgress(progressKey(date, 'attempt'), initial) ??
    readProgress(`three-moves:v0.2:${date}:attempt`, initial) ?? { game: initial, result: null }
  );
}

function readProgress(key: string, initial: GameState): DailyProgress | null {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    const moves = saved && typeof saved === 'object' && 'moves' in saved ? saved.moves : saved;
    if (Array.isArray(moves) && moves.length <= MOVE_LIMIT && moves.every(isMove)) {
      const game = moves.reduce((game, [row, column]) => playMove(game, row, column), initial);
      if (Array.isArray(saved)) {
        const result =
          gameStatus(game) === 'playing' ? null : recordAttempt(null, lightsRemaining(game));
        return { game, result };
      }
      if (saved && typeof saved === 'object' && 'result' in saved) {
        if (saved.result === null || isDailyResult(saved.result))
          return { game, result: saved.result };
      }
    }
  } catch {
    // The puzzle is still playable when storage is unavailable or the save is invalid.
  }

  return null;
}

export function saveProgress(
  date: string,
  previous: DailyProgress,
  game: GameState,
): DailyProgress {
  const saved = loadProgress(date);
  if (
    gameStatus(saved.game) === 'perfect' ||
    (saved.result?.attempts ?? 0) > (previous.result?.attempts ?? 0)
  ) {
    return saved;
  }

  const status = gameStatus(game);
  const result =
    status === 'playing' ? previous.result : recordAttempt(previous.result, lightsRemaining(game));

  try {
    // Retain the existing win key so an older attempt cannot overwrite a Perfect result.
    const kind = status === 'perfect' ? 'win' : 'attempt';
    localStorage.setItem(progressKey(date, kind), JSON.stringify({ moves: game.moves, result }));
  } catch {
    // Keep the current attempt in memory when the browser cannot save it.
  }

  return { game, result };
}

export function loadResultHistory(): ResultHistory {
  const dates = new Set<string>();
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      const date = key?.match(/^three-moves:v0\.[23]:(\d{4}-\d{2}-\d{2}):(attempt|win)$/)?.[1];
      if (date && Number.isFinite(Date.parse(date))) dates.add(date);
    }
  } catch {
    // Statistics can still include the current in-memory result.
  }

  const history: Partial<Record<string, DailyResult>> = {};
  for (const date of dates) {
    const { result } = loadProgress(date);
    if (result) history[date] = result;
  }
  return history;
}

export function isProgressKey(key: string | null): boolean {
  return key === null || /^three-moves:v0\.[23]:/.test(key);
}

function isDailyResult(value: unknown): value is DailyResult {
  if (typeof value !== 'object' || value === null) return false;
  const { first, best, attempts } = value as Partial<DailyResult>;
  return (
    typeof first === 'number' &&
    Number.isInteger(first) &&
    first <= BOARD_SIZE ** 2 &&
    typeof best === 'number' &&
    Number.isInteger(best) &&
    best >= 0 &&
    best <= first &&
    typeof attempts === 'number' &&
    Number.isSafeInteger(attempts) &&
    attempts > 0
  );
}

function isMove(value: unknown): value is Move {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((index) => Number.isInteger(index) && index >= 0 && index < BOARD_SIZE)
  );
}
