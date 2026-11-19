import { describe, expect, it } from 'vitest';
import { createDailyGame, utcDate } from './daily-puzzle';
import { BOARD_SIZE, createGame, toggleLights, type GameState, type Move } from './game';

const tiles: Move[] = Array.from({ length: BOARD_SIZE ** 2 }, (_, index) => [
  Math.floor(index / BOARD_SIZE),
  index % BOARD_SIZE,
]);

function boardKey(board: GameState['board']): string {
  return board.flat().map(Number).join('');
}

describe('daily puzzle', () => {
  it('uses the UTC date and produces the same puzzle across times and time zones', () => {
    const morning = utcDate(new Date('2026-11-19T00:30:00Z'));
    const evening = utcDate(new Date('2026-11-20T01:30:00+02:00'));

    expect(morning).toBe('2026-11-19');
    expect(evening).toBe(morning);
    expect(createDailyGame(morning)).toEqual(createDailyGame(evening));
    expect(createDailyGame(morning)).toEqual(
      createGame([
        [1, 0],
        [3, 1],
        [3, 2],
      ]),
    );
    expect(utcDate(new Date('2026-11-20T00:00:00Z'))).toBe('2026-11-20');
  });

  it('generates only puzzles with minimum solution length three across the full cycle', () => {
    const empty = createGame([]).board;
    const withinTwo = new Set([boardKey(empty)]);
    const inThree = new Set<string>();

    // Each move reverses itself, so reachability from empty gives solution lengths.
    for (const first of tiles) {
      const afterOne = toggleLights(empty, ...first);
      withinTwo.add(boardKey(afterOne));
      for (const second of tiles) {
        const afterTwo = toggleLights(afterOne, ...second);
        withinTwo.add(boardKey(afterTwo));
        for (const third of tiles) {
          inThree.add(boardKey(toggleLights(afterTwo, ...third)));
        }
      }
    }

    const firstDay = Date.UTC(2024, 1, 28);
    const dailyBoards = new Set<string>();
    for (let offset = 0; offset < 560; offset++) {
      const date = utcDate(new Date(firstDay + offset * 86_400_000));
      const game = createDailyGame(date);
      const key = boardKey(game.board);
      expect(game.moves, date).toHaveLength(0);
      expect(withinTwo.has(key), date).toBe(false);
      expect(inThree.has(key), date).toBe(true);
      dailyBoards.add(key);
    }

    expect(dailyBoards.size).toBe(560);
    const nextCycle = utcDate(new Date(firstDay + 560 * 86_400_000));
    expect(createDailyGame(nextCycle)).toEqual(createDailyGame(utcDate(new Date(firstDay))));
  });
});
