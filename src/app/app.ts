import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { loadProgress, progressKey, saveProgress } from './daily-progress';
import { createDailyGame, utcDate } from './daily-puzzle';
import { gameStatus, MOVE_LIMIT, playMove, type GameState } from './game';

@Component({
  imports: [],
  host: {
    '(document:visibilitychange)': 'refreshDate()',
    '(window:focus)': 'refreshDate()',
    '(window:storage)': 'refreshProgress($event)',
  },
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly challenge = signal(this.loadChallenge(utcDate(new Date())));
  protected readonly date = computed(() => this.challenge().date);
  protected readonly game = computed(() => this.challenge().game);
  protected readonly status = computed(() => gameStatus(this.game()));
  protected readonly movesLeft = computed(() => MOVE_LIMIT - this.game().moves.length);
  protected readonly moveSlots = Array.from({ length: MOVE_LIMIT }, (_, index) => index);

  constructor() {
    const timer = setInterval(() => this.refreshDate(), 1_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected selectTile(row: number, column: number): void {
    if (this.refreshDate()) return;

    const previous = this.game();
    const game = playMove(previous, row, column);
    if (game !== previous) this.commit(game);
  }

  protected restart(): void {
    if (this.refreshDate() || this.status() === 'won') return;
    this.commit(createDailyGame(this.date()));
  }

  protected refreshDate(): boolean {
    const date = utcDate(new Date());
    if (date === this.date()) return false;

    this.challenge.set(this.loadChallenge(date));
    return true;
  }

  protected refreshProgress(event: StorageEvent): void {
    if (this.refreshDate() || this.status() === 'won') return;
    const date = this.date();
    if (event.key === progressKey(date, 'attempt') || event.key === progressKey(date, 'win')) {
      this.challenge.set(this.loadChallenge(date));
    }
  }

  private loadChallenge(date: string) {
    return { date, game: loadProgress(date) };
  }

  private commit(game: GameState): void {
    const date = this.date();
    this.challenge.set({ date, game: saveProgress(date, game) });
  }
}
