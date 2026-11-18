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
): { index: number; total: number; next: Post; nextIndex: number } {
  const i = posts.findIndex((p) => p.path === path);
  if (i === -1) throw new Error(`Unknown post: ${path}`);
  const n = (i + 1) % posts.length;
  return {
    index: i + 1,
    total: posts.length,
    next: posts[n],
    nextIndex: n + 1,
  };
}
export const SITE_URL = 'https://www.mohandong.com';
