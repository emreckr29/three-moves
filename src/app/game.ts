export const BOARD_SIZE = 4;
export const MOVE_LIMIT = 3;

type Board = readonly (readonly boolean[])[];
type GameStatus = 'playing' | 'complete' | 'perfect';
export type Move = readonly [row: number, column: number];

export interface GameState {
  readonly board: Board;
  readonly moves: readonly Move[];
  readonly moveLimit: number;
}

export function toggleLights(board: Board, row: number, column: number): Board {
  return board.map((tiles, r) => tiles.map((lit, c) => (r === row || c === column ? !lit : lit)));
}

export function createGame(startingMoves: readonly Move[], moveLimit = MOVE_LIMIT): GameState {
  const emptyBoard: Board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
  const board = startingMoves.reduce((current, [row, column]) => {
    return toggleLights(current, row, column);
  }, emptyBoard);

  return { board, moves: [], moveLimit };
}

export function lightsRemaining({ board }: GameState): number {
  return board.reduce((total, row) => total + row.filter(Boolean).length, 0);
}

export function gameStatus(game: GameState): GameStatus {
  if (game.moves.length < game.moveLimit) return 'playing';
  return lightsRemaining(game) === 0 ? 'perfect' : 'complete';
}

export function playMove(game: GameState, row: number, column: number): GameState {
  if (gameStatus(game) !== 'playing') return game;

  return {
    ...game,
    board: toggleLights(game.board, row, column),
    moves: [...game.moves, [row, column]],
  };
}
