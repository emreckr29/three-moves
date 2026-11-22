# Three Moves

Three Moves is a daily browser puzzle built with Angular 22 and TypeScript. Select a tile to flip every light in its row and column. Hover over a tile with a mouse or focus it with the keyboard to preview the affected lights.

- **Daily Challenge** gives everyone the same starting board for each UTC date. Leave as few of the 16 lights on as possible in exactly three moves. Every completed attempt earns a score, and zero lights earns **Perfect**. Retry to improve your score until you reach Perfect.
- **Practice** offers fixed one-move and two-move puzzles to learn how the lights flip. Practice stays in memory and has no effect on daily progress or statistics.

Your browser saves daily moves, first-attempt score, best score and total completed attempts. Daily statistics track days with a completed attempt, Perfect days, and current and longest Perfect streaks. **Share Result** includes the UTC date and scores without revealing any moves.

## Local development

Install the existing dependencies with `npm ci`, then run `npm start` and open `http://localhost:4200/`.

- Run `npm test -- --watch=false` for the unit tests.
- Run `npm run build` for a production build in `dist/`.

## Implementation

- `src/app/game.ts` and `src/app/results.ts` contain pure board rules, scoring, statistics and share text.
- `src/app/daily-puzzle.ts` uses the UTC day to select one of 560 unique boards made from three distinct moves. The cycle repeats every 560 days. Tests verify that every board is solvable in exactly three moves.
- `src/app/practice-puzzle.ts` defines the two fixed practice boards and their move limits.
- `src/app/daily-progress.ts` restores existing v0.2 and v0.3 saves by replaying moves. Perfect results keep the existing separate storage key, which gives them priority over attempts from other tabs.
- The Angular component checks the UTC date while the page is open and when it regains focus or changes visibility.
