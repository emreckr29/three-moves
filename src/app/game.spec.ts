import { describe, expect, it } from 'vitest';
import { createGame, gameStatus, playMove, toggleLights } from './game';

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

  it('starts with the predefined puzzle and no moves used', () => {
    expect(createGame()).toEqual({
      board: [
        [true, true, false, false],
        [false, true, true, false],
        [true, false, true, true],
        [false, true, false, true],
      ],
      movesUsed: 0,
    });
  });

  it('wins when the third move turns off the last lights', () => {
    const first = playMove(createGame(), 0, 0);
    const second = playMove(first, 1, 2);
    const third = playMove(second, 3, 3);

    expect(gameStatus(first)).toBe('playing');
    expect(gameStatus(second)).toBe('playing');
    expect(third).toEqual({ board: emptyBoard, movesUsed: 3 });
    expect(gameStatus(third)).toBe('won');
  });

  it('wins immediately if the board is cleared before the move limit', () => {
    const game = { board: toggleLights(emptyBoard, 0, 0), movesUsed: 0 };
    const won = playMove(game, 0, 0);

    expect(won.movesUsed).toBe(1);
    expect(gameStatus(won)).toBe('won');
    expect(playMove(won, 0, 1)).toBe(won);
  });

  it('loses after three moves with lights still on and ignores further moves', () => {
    const first = playMove(createGame(), 0, 0);
    const second = playMove(first, 0, 0);
    const third = playMove(second, 0, 0);

    expect(gameStatus(second)).toBe('playing');
    expect(third.movesUsed).toBe(3);
    expect(third.board.flat()).toContain(true);
    expect(gameStatus(third)).toBe('lost');
    expect(playMove(third, 3, 3)).toBe(third);
  });
});
