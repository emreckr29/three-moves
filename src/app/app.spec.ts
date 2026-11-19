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
    vi.unstubAllGlobals();
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
    const score = first.lights().filter((lit) => lit === 'true').length;
    expect(first.status()).toContain(`${score} of 16 lights left`);
    first.fixture.destroy();

    const reopened = openGame();
    expect(reopened.status()).toContain('0 moves left');
    expect(reopened.status()).toContain('Out of moves');
    expect(reopened.tiles.every((tile) => tile.disabled)).toBe(true);
    expect(reopened.restart.textContent).toContain('Retry');
    expect(reopened.fixture.nativeElement.querySelector('.results .metrics').textContent).toContain(
      `${score} / 16`,
    );

    reopened.restart.click();
    reopened.fixture.detectChanges();
    expect(reopened.status()).toContain('3 moves left');
    expect(reopened.lights()).toEqual(initialLights);
    reopened.fixture.destroy();

    const retry = openGame();
    expect(retry.status()).toContain('3 moves left');
    for (const index of [4, 13, 14]) retry.play(index);
    expect(retry.status()).toContain('0 of 16 lights left');
    retry.fixture.destroy();

    const solved = openGame();
    const page = solved.fixture.nativeElement as HTMLElement;
    expect(
      Array.from(page.querySelectorAll('.results dd'), (value) => value.textContent?.trim()),
    ).toEqual([`${score} / 16`, '0 / 16', '2']);
    expect(page.querySelector('.outcome')?.textContent?.trim()).toBe('Solved');
    expect(
      Array.from(page.querySelectorAll('.statistics dd'), (value) => value.textContent?.trim()),
    ).toEqual(['1', '1', '1']);
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
    expect(JSON.parse(localStorage.getItem(progressKey(date, 'win'))!)).toEqual({
      moves: [
        [1, 0],
        [3, 1],
        [3, 2],
      ],
      result: { first: 0, best: 0, attempts: 1 },
    });
    expect(game.fixture.nativeElement.querySelector('.results')).toBeNull();
    expect(
      Array.from(
        (game.fixture.nativeElement as HTMLElement).querySelectorAll('.statistics dd'),
        (value) => value.textContent?.trim(),
      ),
    ).toEqual(['1', '1', '1']);
  });

  it('recovers a saved v0.2 win and includes it in statistics', () => {
    localStorage.setItem(`three-moves:v0.2:${date}:win`, '[[1,0],[3,1],[3,2]]');

    const game = openGame();
    expect(game.status()).toContain('You win!');
    expect(game.restart.disabled).toBe(true);
    expect(
      game.fixture.nativeElement.querySelector('.statistics dd:last-child').textContent.trim(),
    ).toBe('1');
  });

  it.each(['native', 'clipboard'] as const)('shares the daily result using %s', async (method) => {
    const game = openGame();
    for (const index of [4, 13, 14]) game.play(index);
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      share: method === 'native' ? share : undefined,
      clipboard: { writeText },
    });

    game.fixture.nativeElement.querySelector('.share').click();
    await game.fixture.whenStable();
    game.fixture.detectChanges();

    const text =
      'Three Moves — 2026-11-19 UTC\nFirst attempt: 0/16 lights left\nBest result: 0/16 lights left\nSolved in 1 attempt';
    if (method === 'native') {
      expect(share).toHaveBeenCalledWith({ text });
      expect(writeText).not.toHaveBeenCalled();
    } else {
      expect(writeText).toHaveBeenCalledWith(text);
      expect(game.fixture.nativeElement.querySelector('.share-feedback').textContent).toContain(
        'Result copied',
      );
    }
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
