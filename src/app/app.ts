import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { PRODUCTION_GAME_URL } from './app.config';
import { isProgressKey, loadProgress, loadResultHistory, saveProgress } from './daily-progress';
import { createDailyGame, utcDate } from './daily-puzzle';
import {
  BOARD_SIZE,
  gameStatus,
  lightsRemaining,
  playMove,
  type GameState,
  type Move,
} from './game';
import { createPracticeGame, type PracticeLength } from './practice-puzzle';
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
  private readonly productionGameUrl = inject(PRODUCTION_GAME_URL);
  private readonly challenge = signal(this.loadChallenge(utcDate(new Date())));
  private readonly history = signal(loadResultHistory());
  private readonly practiceGame = signal<GameState | null>(null);
  private readonly hoveredTile = signal<Move | null>(null);
  private readonly focusedTile = signal<Move | null>(null);
  protected readonly practice = computed(() => this.practiceGame() !== null);
  protected readonly date = computed(() => this.challenge().date);
  protected readonly game = computed(() => this.practiceGame() ?? this.challenge().progress.game);
  protected readonly result = computed(() => this.challenge().progress.result);
  protected readonly status = computed(() => gameStatus(this.game()));
  protected readonly lightsLeft = computed(() => lightsRemaining(this.game()));
  protected readonly lightCount = BOARD_SIZE ** 2;
  protected readonly movesLeft = computed(() => this.game().moveLimit - this.game().moves.length);
  protected readonly moveSlots = computed(() =>
    Array.from({ length: this.game().moveLimit }, (_, index) => index),
  );
  protected readonly preview = computed(() =>
    this.status() === 'playing' ? (this.hoveredTile() ?? this.focusedTile()) : null,
  );
  protected readonly statistics = computed(() =>
    dailyStatistics({ ...this.history(), [this.date()]: this.result() ?? undefined }, this.date()),
  );
  protected readonly shareFeedback = signal('');

  constructor() {
    const timer = setInterval(() => this.refreshDate(), 1_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected selectTile(row: number, column: number): void {
    if (this.refreshDate() && !this.practice()) return;

    const previous = this.game();
    const game = playMove(previous, row, column);
    if (game === previous) return;

    if (this.practice()) {
      this.practiceGame.set(game);
    } else {
      this.commit(game);
    }
  }

  protected restart(): void {
    const practice = this.practiceGame();
    if (practice) {
      this.openPractice(practice.moveLimit === 1 ? 1 : 2);
      return;
    }

    if (this.refreshDate() || this.status() === 'perfect') return;
    this.clearPreview();
    this.commit(createDailyGame(this.date()));
  }

  protected openDaily(): void {
    this.refreshDate();
    this.practiceGame.set(null);
    this.clearPreview();
  }

  protected openPractice(length: PracticeLength): void {
    this.practiceGame.set(createPracticeGame(length));
    this.clearPreview();
  }

  protected previewPointer(event: PointerEvent, tile: Move | null): void {
    if (event.pointerType === 'mouse') this.hoveredTile.set(tile);
  }

  protected previewFocus(button: HTMLButtonElement, row: number, column: number): void {
    if (button.matches(':focus-visible')) this.focusedTile.set([row, column]);
  }

  protected clearFocus(): void {
    this.focusedTile.set(null);
  }

  private clearPreview(): void {
    this.hoveredTile.set(null);
    this.clearFocus();
  }

  protected refreshDate(): boolean {
    const date = utcDate(new Date());
    if (date === this.date()) return false;

    this.challenge.set(this.loadChallenge(date));
    this.history.set(loadResultHistory());
    this.shareFeedback.set('');
    if (!this.practice()) this.clearPreview();
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
    const text = shareText(date, result, this.productionGameUrl);
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
