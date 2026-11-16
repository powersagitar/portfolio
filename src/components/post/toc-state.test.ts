import { describe, expect, test } from 'bun:test';

import { tocState } from './toc-state';

describe('tocState', () => {
  test('nothing passed yet: first entry, no progress', () => {
    expect(tocState([500, 900], { top: 400, height: 2000 }, 1000)).toEqual({
      active: 0,
      progress: 0,
    });
  });

  test('active is the last heading above the 33% line', () => {
    expect(tocState([100, 300], { top: -500, height: 2000 }, 1000).active).toBe(
      1,
    );
  });

  test('past the end: last entry, full progress', () => {
    expect(tocState([-900, -400], { top: -3000, height: 2000 }, 1000)).toEqual({
      active: 1,
      progress: 1,
    });
  });

  test('no headings still returns a number', () => {
    expect(tocState([], { top: 0, height: 0 }, 1000)).toEqual({
      active: 0,
      progress: expect.any(Number),
    });
  });
});
