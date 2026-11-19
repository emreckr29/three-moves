# Three Moves

Three Moves is a browser puzzle built with Angular 22 and TypeScript. Select a tile to flip every light in its row and column. Turn all 16 lights off in three moves or fewer. **Restart** restores the fixed starting puzzle and gives you three moves again.

## Local development

Install the existing dependencies with `npm ci`, then run `npm start` and open `http://localhost:4200/`.

- Run `npm test -- --watch=false` for the unit tests.
- Run `npm run build` for a production build in `dist/`.

## Game rules

`src/app/game.ts` contains the pure TypeScript rules. It builds the puzzle by applying three moves to an all-off board. Each move reverses its own effect, so replaying the same three moves clears the board. The Angular component holds the game state in a signal and renders the board, move count, and outcome.
