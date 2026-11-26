// The home index's rows, in order. Single source of truth: `CloudKey`, the
// cloud's `SHAPES`, the `IndexList` panels, row numbers, the hero's count and
// the URL hash all derive from (or are type-checked against) this list.
export const SECTIONS = [
  { id: 'about', title: 'About', meta: 'Person' },
  { id: 'badge', title: 'Hack the Badge', meta: 'Project · Rust' },
  { id: 'howto', title: 'how-to', meta: 'Project · Shell' },
  { id: 'mssg', title: 'mssg', meta: 'Project · TypeScript' },
  { id: 'spaces', title: 'Space Indicator', meta: 'Project · Swift' },
  { id: 'writing', title: 'Writing', meta: 'Posts' },
  { id: 'contact', title: 'Contact', meta: 'Elsewhere' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/** The section that lists the blog posts (post pages and `/blog` link here). */
export const POSTS_SECTION: SectionId = 'writing';

const IDS: readonly string[] = SECTIONS.map((s) => s.id);

/** Two-digit, 1-based: `01`, `02`, … */
export const pad2 = (n: number): string => String(n).padStart(2, '0');

export const sectionNumber = (id: SectionId): string =>
  pad2(IDS.indexOf(id) + 1);

export const sectionTitle = (id: SectionId): string =>
  SECTIONS.find((s) => s.id === id)!.title;

/** `'writing'` -> `/#writing`: the home page with that row open. */
export const sectionHref = (id: SectionId): string => `/#${id}`;

/** `#writing` -> `'writing'`; anything that is not a section -> null. */
export const sectionFromHash = (hash: string): SectionId | null => {
  const id = hash.replace(/^#/, '');
  return IDS.includes(id) ? (id as SectionId) : null;
};
