import { expect, test } from 'bun:test';

import { outlineFromMdx } from './outline';
import { getOutline } from './posts';

const ids = (yyyy: string, mm: string, dd: string, slug: string) =>
  getOutline({ yyyy, mm, dd, slug }).sections.map((s) => s.id);

test('real post ids and labels', () => {
  expect(
    getOutline({
      yyyy: '2024',
      mm: '02',
      dd: '01',
      slug: 'decoding-conditionals',
    }),
  ).toEqual({
    sections: [
      { id: 'if-else-statements', label: 'if-else Statements' },
      { id: 'switch-cases', label: 'switch Cases' },
      { id: 'lookup-tables', label: 'Lookup Tables' },
      { id: 'interfaces', label: 'Interfaces' },
      { id: 'summary', label: 'Summary' },
    ],
    codeBlocks: 4,
  });
  expect(ids('2025', '01', '16', 'mastermind')).toEqual([
    'the-communications',
    'the-engineering',
    'conclusion',
  ]);
  expect(ids('2025', '03', '09', 'we-dream-high')).toEqual([
    'what-a-tough-year',
    'grade-12-is-not-without-fun',
    'thanks-for-reading',
    'update-on-may-8-2025',
  ]);
  const badge = ids('2026', '11', '16', 'hack-the-badge');
  expect(badge).toHaveLength(7);
  expect(badge[0]).toBe('the-plan-that-didnt-survive-day-one');
  expect(badge[6]).toBe('looking-back');
});

test('frontmatter is not a heading', () => {
  expect(outlineFromMdx('---\ntitle: X\n---\n\n## A\n').sections).toEqual([
    { id: 'a', label: 'A' },
  ]);
});

test('duplicate slugs count every heading level', () => {
  expect(outlineFromMdx('### Intro\n\n## Intro\n').sections).toEqual([
    { id: 'intro-1', label: 'Intro' },
  ]);
});

test('counts fenced code blocks', () => {
  expect(outlineFromMdx('```cpp\nx\n```\n\n```\ny\n```\n').codeBlocks).toBe(2);
});
