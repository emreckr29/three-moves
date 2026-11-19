import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  it('plays the puzzle through the tile buttons and restarts after a win', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const tiles = Array.from(page.querySelectorAll<HTMLButtonElement>('.tile'));
    const status = page.querySelector('[role="status"]');
    const startingLights = tiles.map((tile) => tile.getAttribute('aria-pressed'));

    expect(page.querySelector('h1')?.textContent).toContain('Three Moves');
    expect(tiles).toHaveLength(16);
    expect(status?.textContent).toContain('3 moves left');

    tiles[0].click();
    fixture.detectChanges();
    expect(status?.textContent).toContain('2 moves left');

    tiles[6].click();
    fixture.detectChanges();
    tiles[15].click();
    fixture.detectChanges();

    expect(status?.textContent).toContain('You win!');
    expect(
      tiles.every((tile) => tile.disabled && tile.getAttribute('aria-pressed') === 'false'),
    ).toBe(true);

    page.querySelector<HTMLButtonElement>('.restart')?.click();
    fixture.detectChanges();

    expect(status?.textContent).toContain('3 moves left');
    expect(tiles.every((tile) => !tile.disabled)).toBe(true);
    expect(tiles.map((tile) => tile.getAttribute('aria-pressed'))).toEqual(startingLights);
  });
});
