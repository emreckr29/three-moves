import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { progressKey } from './daily-progress';

const date = '2026-11-19';

function openGame() {
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();

  const page = fixture.nativeElement as HTMLElement;
  const tiles = Array.from(page.querySelectorAll<HTMLButtonElement>('.tile'));

  return {
    fixture,
    tiles,
    restart: page.querySelector<HTMLButtonElement>('.restart')!,
    status: () => page.querySelector('[role="status"]')?.textContent,
    date: () => page.querySelector('time')?.dateTime,
    lights: () => tiles.map((tile) => tile.getAttribute('aria-pressed')),
    play(index: number) {
      tiles[index].click();
      fixture.detectChanges();
    },
  };
}

describe('Daily Challenge', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date(date + 'T23:59:59.500Z'));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('restores the board and remaining moves after reopening the page', () => {
    const first = openGame();
    expect(first.tiles).toHaveLength(16);
    expect(first.date()).toBe(date);
    expect(first.status()).toContain('3 moves left');

    first.play(4);
    const lights = first.lights();
    first.fixture.destroy();

    const reopened = openGame();
    expect(reopened.lights()).toEqual(lights);
    expect(reopened.status()).toContain('2 moves left');
  });

  it('restores a loss and saves the retry with a full move count', () => {
    const first = openGame();
    const initialLights = first.lights();
    for (let move = 0; move < 3; move++) first.play(0);
    first.fixture.destroy();

    const reopened = openGame();
    expect(reopened.status()).toContain('0 moves left');
    expect(reopened.status()).toContain('Out of moves');
    expect(reopened.tiles.every((tile) => tile.disabled)).toBe(true);
    expect(reopened.restart.textContent).toContain('Retry');

    reopened.restart.click();
    reopened.fixture.detectChanges();
    expect(reopened.status()).toContain('3 moves left');
    expect(reopened.lights()).toEqual(initialLights);
    reopened.fixture.destroy();

    expect(openGame().status()).toContain('3 moves left');
  });

  it('preserves a win after refresh and ignores a stale attempt from another tab', () => {
    const first = openGame();
    for (const index of [4, 13, 14]) first.play(index);
    expect(first.status()).toContain('You win!');
    first.fixture.destroy();

    localStorage.setItem(progressKey(date, 'attempt'), '[[0,0]]');
    const reopened = openGame();
    expect(reopened.status()).toContain('You win!');
    expect(reopened.restart.disabled).toBe(true);
    expect(
      reopened.tiles.every(
        (tile) => tile.disabled && tile.getAttribute('aria-pressed') === 'false',
      ),
    ).toBe(true);
  });

  it('switches to a fresh puzzle at UTC midnight while the page is open', () => {
    const game = openGame();
    const initialLights = game.lights();
    for (const index of [4, 13, 14]) game.play(index);
    expect(game.status()).toContain('You win!');

    vi.advanceTimersByTime(1_000);
    game.fixture.detectChanges();

    expect(game.date()).toBe('2026-11-20');
    expect(game.status()).toContain('3 moves left');
    expect(game.status()).not.toContain('You win!');
    expect(game.lights()).not.toEqual(initialLights);
    expect(game.tiles.every((tile) => !tile.disabled)).toBe(true);
    expect(localStorage.getItem(progressKey(date, 'win'))).toBe('[[1,0],[3,1],[3,2]]');
  });

  it('refreshes a backgrounded page on visibility change and rejects corrupt saves', () => {
    const game = openGame();
    const nextDate = '2026-11-20';
    localStorage.setItem(progressKey(nextDate, 'attempt'), '[[4,0]]');
    localStorage.setItem(progressKey(nextDate, 'win'), '{invalid json');
    vi.setSystemTime(new Date(nextDate + 'T08:00:00Z'));

    document.dispatchEvent(new Event('visibilitychange'));
    game.fixture.detectChanges();

    expect(game.date()).toBe(nextDate);
    expect(game.status()).toContain('3 moves left');
    expect(game.tiles.every((tile) => !tile.disabled)).toBe(true);
  });
});
