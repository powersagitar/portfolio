export type PostParams = { yyyy: string; mm: string; dd: string; slug: string };

export type Post = PostParams & {
  path: string;
  title: string;
  description: string;
  publishDate: string;
  lastEdited?: string;
};

export function postPath({ yyyy, mm, dd, slug }: PostParams): string {
  return `/blog/${yyyy}/${mm}/${dd}/${slug}`;
}

export function toIsoDate(v: unknown): string {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  throw new Error(`Invalid date: ${String(v)}`);
}

export function splitTitle(
  title: string,
  description: string,
): { headline: string; subhead: string } {
  const i = title.indexOf(':');
  if (i === -1) return { headline: title, subhead: description };
  return {
    headline: title.slice(0, i).trim(),
    subhead: title.slice(i + 1).trim(),
  };
}

export function sortNewestFirst(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) =>
      b.publishDate.localeCompare(a.publishDate) ||
      a.slug.localeCompare(b.slug),
  );
}

export function postPosition(
  posts: Post[],
  path: string,
): { index: number; total: number; next: Post } {
  const i = posts.findIndex((p) => p.path === path);
  if (i === -1) throw new Error(`Unknown post: ${path}`);
  return {
    index: i + 1,
    total: posts.length,
    next: posts[(i + 1) % posts.length],
  };
}
export const SITE_URL = 'https://www.mohandong.com';
