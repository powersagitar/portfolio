import { afterAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getPost, getPosts } from './posts';

describe('getPosts', () => {
  test('lists the real posts newest first', () => {
    expect(getPosts().map((p) => p.slug)).toEqual([
      'we-dream-high',
      'mastermind',
      'decoding-conditionals',
    ]);
  });
  test('publishDate is a string matching the path', () => {
    for (const p of getPosts()) {
      expect(p.publishDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.publishDate).toBe(`${p.yyyy}-${p.mm}-${p.dd}`);
    }
  });
  test('getPost returns undefined for unknown posts', () => {
    expect(
      getPost({ yyyy: '2024', mm: '02', dd: '01', slug: 'nope' }),
    ).toBeUndefined();
  });
  test('names the file when frontmatter is invalid', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'posts-'));
    afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
    const dir = path.join(tmp, '2024', '02', '01');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'bad.mdx'),
      '---\ndescription: d\npublish-date: 2024-02-01\n---\nbody\n',
    );
    expect(() => getPosts(tmp)).toThrow(/bad\.mdx/);
  });
});
