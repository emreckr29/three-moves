# Three Moves

Three Moves is a daily browser puzzle built with Angular 22 and TypeScript. Select a tile to flip every light in its row and column. Turn all 16 lights off in exactly three moves.

A new challenge starts at midnight UTC. The date determines the same starting board for every player. Your browser saves your moves and result for each date. Select **Retry** after a loss to start that day's puzzle again. A win stays completed for the rest of the UTC day.

## Local development

Install the existing dependencies with `npm ci`, then run `npm start` and open `http://localhost:4200/`.

- Run `npm test -- --watch=false` for the unit tests.
- Run `npm run build` for a production build in `dist/`.

## Implementation

- `src/app/game.ts` contains the pure board and game rules.
- `src/app/daily-puzzle.ts` uses the UTC day to select one of 560 unique boards made from three distinct moves. The cycle repeats every 560 days. Tests verify that every board is solvable in exactly three moves.
- `src/app/daily-progress.ts` saves moves in localStorage by date. It restores the board and outcome by replaying those moves, and saves wins under a separate key so another tab's attempt cannot overwrite them.
- The Angular component checks the UTC date while the page is open and when it regains focus or changes visibility.
