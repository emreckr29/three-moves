export const BOARD_SIZE = 4;
export const MOVE_LIMIT = 3;

type Board = readonly (readonly boolean[])[];
type GameStatus = 'playing' | 'won' | 'lost';

interface GameState {
  readonly board: Board;
  readonly movesUsed: number;
}

const STARTING_MOVES = [
  [0, 0],
  [1, 2],
  [3, 3],
] as const;

export function toggleLights(board: Board, row: number, column: number): Board {
  return board.map((tiles, r) => tiles.map((lit, c) => (r === row || c === column ? !lit : lit)));
}

export function createGame(): GameState {
  const emptyBoard: Board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
  const board = STARTING_MOVES.reduce((current, [row, column]) => {
    return toggleLights(current, row, column);
  }, emptyBoard);

  return { board, movesUsed: 0 };
}

export function gameStatus({ board, movesUsed }: GameState): GameStatus {
  if (board.every((row) => row.every((lit) => !lit))) return 'won';
  return movesUsed >= MOVE_LIMIT ? 'lost' : 'playing';
}

export function playMove(game: GameState, row: number, column: number): GameState {
  if (gameStatus(game) !== 'playing') return game;

  return { board: toggleLights(game.board, row, column), movesUsed: game.movesUsed + 1 };
}
