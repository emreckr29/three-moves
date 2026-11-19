export const BOARD_SIZE = 4;
export const MOVE_LIMIT = 3;

type Board = readonly (readonly boolean[])[];
type GameStatus = 'playing' | 'won' | 'lost';
export type Move = readonly [row: number, column: number];

export interface GameState {
  readonly board: Board;
  readonly moves: readonly Move[];
}

export function toggleLights(board: Board, row: number, column: number): Board {
  return board.map((tiles, r) => tiles.map((lit, c) => (r === row || c === column ? !lit : lit)));
}

export function createGame(startingMoves: readonly Move[]): GameState {
  const emptyBoard: Board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
  const board = startingMoves.reduce((current, [row, column]) => {
    return toggleLights(current, row, column);
  }, emptyBoard);

  return { board, moves: [] };
}

export function gameStatus({ board, moves }: GameState): GameStatus {
  if (board.every((row) => row.every((lit) => !lit))) return 'won';
  return moves.length >= MOVE_LIMIT ? 'lost' : 'playing';
}

export function playMove(game: GameState, row: number, column: number): GameState {
  if (gameStatus(game) !== 'playing') return game;

  return { board: toggleLights(game.board, row, column), moves: [...game.moves, [row, column]] };
}
