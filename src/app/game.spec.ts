import { describe, expect, it } from 'vitest';
import {
  BOARD_SIZE,
  createGame,
  gameStatus,
  lightsRemaining,
  MOVE_LIMIT,
  playMove,
  toggleLights,
  type Move,
} from './game';
import { createPracticeGame } from './practice-puzzle';

const startingMoves: readonly Move[] = [
  [0, 0],
  [1, 2],
  [3, 3],
];

const emptyBoard = [
  [false, false, false, false],
  [false, false, false, false],
  [false, false, false, false],
  [false, false, false, false],
];

describe('Three Moves rules', () => {
  it('toggles the selected row and column, including their intersection once', () => {
    const toggled = toggleLights(emptyBoard, 1, 2);

    expect(toggled).toEqual([
      [false, false, true, false],
      [true, true, true, true],
      [false, false, true, false],
      [false, false, true, false],
    ]);
    expect(toggleLights(toggled, 1, 2)).toEqual(emptyBoard);
    expect(emptyBoard.flat()).not.toContain(true);
  });

  it('applies the starting moves without spending any player moves', () => {
    expect(createGame(startingMoves)).toEqual({
      board: [
        [true, true, false, false],
        [false, true, true, false],
        [true, false, true, true],
        [false, true, false, true],
      ],
      moves: [],
      moveLimit: MOVE_LIMIT,
    });
  });

  it('scores Perfect when the third move turns off the last lights', () => {
    const first = playMove(createGame(startingMoves), 0, 0);
    const second = playMove(first, 1, 2);
    const third = playMove(second, 3, 3);

    expect(gameStatus(first)).toBe('playing');
    expect(gameStatus(second)).toBe('playing');
    expect(third).toEqual({ board: emptyBoard, moves: startingMoves, moveLimit: MOVE_LIMIT });
    expect(gameStatus(third)).toBe('perfect');
  });

  it('requires the full move count even if a board is cleared early', () => {
    const game = createGame([[0, 0]]);
    const cleared = playMove(game, 0, 0);

    expect(lightsRemaining(cleared)).toBe(0);
    expect(gameStatus(cleared)).toBe('playing');
    const third = playMove(playMove(cleared, 0, 1), 0, 1);
    expect(third.moves).toHaveLength(3);
    expect(gameStatus(third)).toBe('perfect');
  });

  it('completes with lights still on after three moves and ignores further moves', () => {
    const first = playMove(createGame(startingMoves), 0, 0);
    const second = playMove(first, 0, 0);
    const third = playMove(second, 0, 0);

    expect(gameStatus(second)).toBe('playing');
    expect(third.moves).toHaveLength(3);
    expect(third.board.flat()).toContain(true);
    expect(gameStatus(third)).toBe('complete');
    expect(playMove(third, 3, 3)).toBe(third);
  });

  it('provides fixed practice puzzles with exact one- and two-move solutions', () => {
    const one = createPracticeGame(1);
    const two = createPracticeGame(2);
    expect(lightsRemaining(one)).toBeGreaterThan(0);
    expect(gameStatus(playMove(one, 1, 1))).toBe('perfect');
    expect(two).toEqual(createPracticeGame(2));
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let column = 0; column < BOARD_SIZE; column++) {
        expect(lightsRemaining(playMove(two, row, column))).toBeGreaterThan(0);
      }
    }
    expect(gameStatus(playMove(playMove(two, 0, 0), 3, 3))).toBe('perfect');
  });
});
