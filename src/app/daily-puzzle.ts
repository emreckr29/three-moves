import { BOARD_SIZE, createGame, type GameState, type Move } from './game';

const DAY_MS = 86_400_000;
const TILES: Move[] = Array.from({ length: BOARD_SIZE ** 2 }, (_, index) => [
  Math.floor(index / BOARD_SIZE),
  index % BOARD_SIZE,
]);

const PUZZLES: Move[][] = [];
for (let first = 0; first < TILES.length - 2; first++) {
  for (let second = first + 1; second < TILES.length - 1; second++) {
    for (let third = second + 1; third < TILES.length; third++) {
      PUZZLES.push([TILES[first], TILES[second], TILES[third]]);
    }
  }
}

export function utcDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function createDailyGame(date: string): GameState {
  const day = Date.parse(date) / DAY_MS;
  // The stride is coprime with 560, so all puzzles are visited before any repeats.
  const index = (((day * 137) % PUZZLES.length) + PUZZLES.length) % PUZZLES.length;
  return createGame(PUZZLES[index]);
}
