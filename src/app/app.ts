import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { isProgressKey, loadProgress, loadResultHistory, saveProgress } from './daily-progress';
import { createDailyGame, utcDate } from './daily-puzzle';
import {
  BOARD_SIZE,
  gameStatus,
  lightsRemaining,
  MOVE_LIMIT,
  playMove,
  type GameState,
} from './game';
import { dailyStatistics, shareText } from './results';

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
  private readonly history = signal(loadResultHistory());
  protected readonly date = computed(() => this.challenge().date);
  protected readonly game = computed(() => this.challenge().progress.game);
  protected readonly result = computed(() => this.challenge().progress.result);
  protected readonly status = computed(() => gameStatus(this.game()));
  protected readonly lightsLeft = computed(() => lightsRemaining(this.game()));
  protected readonly lightCount = BOARD_SIZE ** 2;
  protected readonly movesLeft = computed(() => MOVE_LIMIT - this.game().moves.length);
  protected readonly moveSlots = Array.from({ length: MOVE_LIMIT }, (_, index) => index);
  protected readonly statistics = computed(() =>
    dailyStatistics({ ...this.history(), [this.date()]: this.result() ?? undefined }, this.date()),
  );
  protected readonly shareFeedback = signal('');

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
    this.history.set(loadResultHistory());
    this.shareFeedback.set('');
    return true;
  }

  protected refreshProgress(event: StorageEvent): void {
    if (this.refreshDate() || !isProgressKey(event.key)) return;

    this.history.set(loadResultHistory());
    const date = this.date();
    if (event.key === null || event.key.includes(`:${date}:`)) {
      this.challenge.set(this.loadChallenge(date));
      this.shareFeedback.set('');
    }
  }

  protected async shareResult(): Promise<void> {
    if (this.refreshDate()) return;
    const result = this.result();
    if (!result) return;

    const date = this.date();
    const text = shareText(date, result);
    const showFeedback = (message: string) => {
      if (date === this.date() && result === this.result()) this.shareFeedback.set(message);
    };

    this.shareFeedback.set('');
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text });
        showFeedback('Result shared.');
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      showFeedback('Result copied to clipboard.');
    } catch {
      showFeedback('Could not copy the result.');
    }
  }

  private loadChallenge(date: string) {
    return { date, progress: loadProgress(date) };
  }

  private commit(game: GameState): void {
    const { date, progress } = this.challenge();
    const next = saveProgress(date, progress, game);
    if (next.result !== progress.result) this.shareFeedback.set('');
    this.challenge.set({ date, progress: next });
  }
}
