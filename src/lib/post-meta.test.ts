import { describe, expect, test } from 'bun:test';

import {
  type Post,
  postPath,
  postPosition,
  sortNewestFirst,
  splitTitle,
  toIsoDate,
} from './post-meta';

const make = (publishDate: string, slug: string): Post => {
  const [yyyy, mm, dd] = publishDate.split('-');
  return {
    yyyy,
    mm,
    dd,
    slug,
    path: postPath({ yyyy, mm, dd, slug }),
    title: slug,
    description: 'd',
    publishDate,
  };
};

describe('postPath', () => {
  test('builds the URL path', () => {
    expect(
      postPath({
        yyyy: '2024',
        mm: '02',
        dd: '01',
        slug: 'decoding-conditionals',
      }),
    ).toBe('/blog/2024/02/01/decoding-conditionals');
  });
});

describe('toIsoDate', () => {
  test('accepts Date and string', () => {
    expect(toIsoDate(new Date('2024-02-01T00:00:00Z'))).toBe('2024-02-01');
    expect(toIsoDate('2025-03-09')).toBe('2025-03-09');
  });
  test('throws otherwise', () => {
    expect(() => toIsoDate(42)).toThrow();
  });
});

describe('splitTitle', () => {
  test('splits at the first colon', () => {
    expect(
      splitTitle(
        'Decoding Conditionals: A Dive into if-else, switch-case, Lookup Tables, and Interfaces',
        'd',
      ),
    ).toEqual({
      headline: 'Decoding Conditionals',
      subhead:
        'A Dive into if-else, switch-case, Lookup Tables, and Interfaces',
    });
    expect(splitTitle('A: B: C', 'd')).toEqual({
      headline: 'A',
      subhead: 'B: C',
    });
  });
  test('uses the description without a colon', () => {
    expect(
      splitTitle('Mastermind—The ICS4U Culminating Project', 'We finished…'),
    ).toEqual({
      headline: 'Mastermind—The ICS4U Culminating Project',
      subhead: 'We finished…',
    });
  });
});

describe('ordering', () => {
  const a = make('2025-03-09', 'a');
  const b = make('2025-01-16', 'b');
  const c = make('2024-02-01', 'c');
  const sorted = sortNewestFirst([c, a, b]);

  test('sorts newest first, ties by slug', () => {
    expect(sorted).toEqual([a, b, c]);
    const x = make('2025-01-16', 'x');
    expect(sortNewestFirst([x, b]).map((p) => p.slug)).toEqual(['b', 'x']);
  });
  test('postPosition wraps to the newest', () => {
    expect(postPosition(sorted, c.path)).toEqual({
      index: 3,
      total: 3,
      next: a,
    });
    expect(postPosition(sorted, a.path).next).toBe(b);
  });
});
