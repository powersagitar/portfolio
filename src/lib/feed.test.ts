import { describe, expect, test } from 'bun:test';

import { buildFeed } from './feed';
import { type Post, SITE_URL } from './post-meta';

const mk = (slug: string, y: string, m: string, d: string): Post => ({
  yyyy: y,
  mm: m,
  dd: d,
  slug,
  path: `/blog/${y}/${m}/${d}/${slug}`,
  title: `T ${slug}`,
  description: `D ${slug}`,
  publishDate: `${y}-${m}-${d}`,
});

const older = mk('decoding-conditionals', '2024', '02', '01');
const newer = mk('newer-post', '2025', '03', '04');
const html = {
  [older.path]: '<p>older body</p>',
  [newer.path]: '<p>newer body</p>',
};
const xml = buildFeed([newer, older], html, SITE_URL);

describe('buildFeed', () => {
  test('guid and link are the absolute post URL', () => {
    const url = `${SITE_URL}/blog/2024/02/01/decoding-conditionals`;
    expect(xml).toMatch(new RegExp(`<guid[^>]*>${url}</guid>`));
    expect(xml).toContain(`<link>${url}</link>`);
  });
  test('newest item first', () => {
    expect(xml.indexOf('newer-post')).toBeLessThan(
      xml.indexOf('decoding-conditionals'),
    );
  });
  test('includes html in content:encoded', () => {
    expect(xml).toContain('<content:encoded>');
    expect(xml).toContain('<p>older body</p>');
    expect(xml).toContain('<p>newer body</p>');
  });
  test('channel title and feed link', () => {
    expect(xml).toContain('<title>Mohan Dong</title>');
    expect(xml).toContain(`${SITE_URL}/rss.xml`);
  });
});
