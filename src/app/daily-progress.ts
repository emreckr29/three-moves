import { createDailyGame } from './daily-puzzle';
import { BOARD_SIZE, gameStatus, MOVE_LIMIT, playMove, type GameState, type Move } from './game';

export function progressKey(date: string, kind: 'attempt' | 'win'): string {
  return `three-moves:v0.2:${date}:${kind}`;
}

export function loadProgress(date: string): GameState {
  const initial = createDailyGame(date);
  const win = readProgress(progressKey(date, 'win'), initial);
  if (gameStatus(win) === 'won') return win;

  return readProgress(progressKey(date, 'attempt'), initial);
}

function readProgress(key: string, initial: GameState): GameState {
  try {
    const moves: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (Array.isArray(moves) && moves.length <= MOVE_LIMIT && moves.every(isMove)) {
      return moves.reduce((game, [row, column]) => playMove(game, row, column), initial);
    }
  } catch {
    // The puzzle is still playable when storage is unavailable or the save is invalid.
  }

  return initial;
}

export function saveProgress(date: string, game: GameState): GameState {
  const saved = loadProgress(date);
  if (gameStatus(saved) === 'won') return saved;

  try {
    // Keep the win separate so a concurrent attempt cannot overwrite it.
    const kind = gameStatus(game) === 'won' ? 'win' : 'attempt';
    localStorage.setItem(progressKey(date, kind), JSON.stringify(game.moves));
  } catch {
    // Keep the current attempt in memory when the browser cannot save it.
  }

  return game;
}

function isMove(value: unknown): value is Move {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((index) => Number.isInteger(index) && index >= 0 && index < BOARD_SIZE)
  );
}
