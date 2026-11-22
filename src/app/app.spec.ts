import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { PRODUCTION_GAME_URL } from './app.config';
import { progressKey } from './daily-progress';

const date = '2026-11-19';

function openGame() {
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();

  const page = fixture.nativeElement as HTMLElement;
  const tiles = Array.from(page.querySelectorAll<HTMLButtonElement>('.tile'));

  return {
    fixture,
    page,
    tiles,
    restart: page.querySelector<HTMLButtonElement>('.restart')!,
    status: () => page.querySelector('[role="status"]')?.textContent,
    date: () => page.querySelector('time')?.dateTime,
    lights: () => tiles.map((tile) => tile.getAttribute('aria-pressed')),
    statistics: () =>
      Array.from(page.querySelectorAll('.statistics dd'), (value) => value.textContent?.trim()),
    click(selector: string) {
      page.querySelector<HTMLButtonElement>(selector)!.click();
      fixture.detectChanges();
    },
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

  it('restores a scored attempt and preserves its first score through a retry', () => {
    const first = openGame();
    const initialLights = first.lights();
    for (let move = 0; move < 3; move++) first.play(0);
    const score = first.lights().filter((lit) => lit === 'true').length;
    expect(first.status()).toContain(`${score} of 16 lights remaining`);
    expect(first.statistics()).toEqual(['1', '0', '0', '0']);
    first.fixture.destroy();

    const reopened = openGame();
    expect(reopened.status()).toContain(`${score} of 16 lights remaining`);
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
    expect(retry.status()).toContain('Perfect! 0 of 16 lights remaining');
    retry.fixture.destroy();

    const solved = openGame();
    const { page } = solved;
    expect(
      Array.from(page.querySelectorAll('.results dd'), (value) => value.textContent?.trim()),
    ).toEqual([`${score} / 16`, '0 / 16', '2']);
    expect(page.querySelector('.outcome')?.textContent?.trim()).toBe('Perfect');
    expect(solved.statistics()).toEqual(['1', '1', '1', '1']);
  });

  it('preserves Perfect after refresh and ignores a stale attempt from another tab', () => {
    const first = openGame();
    for (const index of [4, 13, 14]) first.play(index);
    expect(first.status()).toContain('Perfect!');
    first.fixture.destroy();

    localStorage.setItem(progressKey(date, 'attempt'), '[[0,0]]');
    const reopened = openGame();
    expect(reopened.status()).toContain('Perfect!');
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
    expect(game.status()).toContain('Perfect!');

    vi.advanceTimersByTime(1_000);
    game.fixture.detectChanges();

    expect(game.date()).toBe('2026-11-20');
    expect(game.status()).toContain('3 moves left');
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
    expect(game.statistics()).toEqual(['1', '1', '1', '1']);
  });

  it('recovers a saved v0.2 win as a Perfect day', () => {
    localStorage.setItem(`three-moves:v0.2:${date}:win`, '[[1,0],[3,1],[3,2]]');

    const game = openGame();
    expect(game.status()).toContain('Perfect!');
    expect(game.restart.disabled).toBe(true);
    expect(game.statistics()).toEqual(['1', '1', '1', '1']);
  });

  it('plays and retries both practice puzzles without changing daily progress or statistics', () => {
    const game = openGame();
    for (const index of [0, 0, 0]) game.play(index);
    expect(game.statistics()).toEqual(['1', '0', '0', '0']);
    game.click('.restart');
    game.play(4);
    const dailyLights = game.lights();
    const saved = localStorage.getItem(progressKey(date, 'attempt'));

    game.click('[aria-label="Game mode"] button:last-child');
    expect(game.status()).toContain('1 move left');
    game.play(5);
    expect(game.status()).toContain('Perfect!');
    game.click('.restart');
    expect(game.status()).toContain('1 move left');
    game.click('[aria-label="Practice puzzle"] button:last-child');
    expect(game.status()).toContain('2 moves left');
    game.play(0);
    expect(game.status()).toContain('1 move left');
    game.play(15);
    expect(game.status()).toContain('Perfect!');
    expect(game.page.querySelector('.results, .statistics')).toBeNull();
    expect(localStorage.length).toBe(1);
    expect(localStorage.getItem(progressKey(date, 'attempt'))).toBe(saved);

    game.click('[aria-label="Game mode"] button:first-child');
    expect(game.lights()).toEqual(dailyLights);
    expect(game.status()).toContain('2 moves left');
    expect(game.statistics()).toEqual(['1', '0', '0', '0']);
  });

  it('previews the affected tiles on hover or keyboard focus and keeps touch playable', () => {
    const game = openGame();
    const tile = game.tiles[5];
    const previewed = () =>
      game.tiles.flatMap((button, index) =>
        button.classList.contains('previewed') ? [index] : [],
      );
    const expected = [1, 4, 5, 6, 7, 9, 13];

    tile.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    game.fixture.detectChanges();
    expect(previewed()).toEqual(expected);
    tile.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    game.fixture.detectChanges();
    expect(previewed()).toEqual([]);

    tile.focus();
    game.fixture.detectChanges();
    expect(previewed()).toEqual(expected);
    tile.blur();
    tile.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
    game.fixture.detectChanges();
    expect(previewed()).toEqual([]);
    game.play(5);
    expect(game.status()).toContain('2 moves left');
  });

  it.each([
    { method: 'native', perfect: true },
    { method: 'native', perfect: false },
    { method: 'clipboard', perfect: true },
    { method: 'clipboard', perfect: false },
  ])('shares the daily result using $method (Perfect: $perfect)', async ({ method, perfect }) => {
    const url = 'https://three-moves.example/';
    TestBed.overrideProvider(PRODUCTION_GAME_URL, { useValue: url });
    const game = openGame();
    for (const index of perfect ? [4, 13, 14] : [0, 0, 0]) game.play(index);
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      share: method === 'native' ? share : undefined,
      clipboard: { writeText },
    });

    game.fixture.nativeElement.querySelector('.share').click();
    await game.fixture.whenStable();
    game.fixture.detectChanges();

    const score = perfect ? 0 : 4;
    const text = [
      'Three Moves — 2026-11-19 UTC',
      `First attempt: ${score}/16 lights remaining`,
      ...(perfect
        ? ['Best score: 0/16 lights remaining — Perfect!', 'Reached in 1 attempt']
        : ['Best score: 4/16 lights remaining']),
      '',
      'Can you match or beat my first attempt in three moves? Play the Daily Challenge.',
      url,
    ].join('\n');
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
