import { createGame, type GameState, type Move } from './game';

export type PracticeLength = 1 | 2;

const practiceMoves: Record<PracticeLength, readonly Move[]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [3, 3],
  ],
};

export function createPracticeGame(length: PracticeLength): GameState {
  return createGame(practiceMoves[length], length);
}
