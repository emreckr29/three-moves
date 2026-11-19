import { Component, computed, signal } from '@angular/core';
import { createGame, gameStatus, MOVE_LIMIT, playMove } from './game';

@Component({
  imports: [],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly game = signal(createGame());
  protected readonly status = computed(() => gameStatus(this.game()));
  protected readonly movesLeft = computed(() => MOVE_LIMIT - this.game().movesUsed);
  protected readonly moveSlots = Array.from({ length: MOVE_LIMIT }, (_, index) => index);

  protected selectTile(row: number, column: number): void {
    this.game.update((game) => playMove(game, row, column));
  }

  protected restart(): void {
    this.game.set(createGame());
  }
}
