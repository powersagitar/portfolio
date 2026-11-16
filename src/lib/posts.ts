import matter from 'gray-matter';
import fs from 'node:fs';
import path from 'node:path';
import 'server-only';

import {
  type Post,
  type PostParams,
  postPath,
  sortNewestFirst,
  toIsoDate,
} from './post-meta';

const cache = new Map<string, Post[]>();

const dirs = (dir: string) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name);

function readPost(file: string, params: PostParams): Post {
  const { data } = matter(fs.readFileSync(file, 'utf8'));
  for (const key of ['title', 'description', 'publish-date']) {
    if (data[key] == null || data[key] === '') {
      throw new Error(`${file}: missing frontmatter "${key}"`);
    }
  }
  try {
    return {
      ...params,
      path: postPath(params),
      title: String(data.title),
      description: String(data.description),
      publishDate: toIsoDate(data['publish-date']),
      ...(data['last-edited'] != null && {
        lastEdited: toIsoDate(data['last-edited']),
      }),
    };
  } catch (e) {
    throw new Error(`${file}: ${(e as Error).message}`);
  }
}

export function getPosts(
  dir: string = path.join(process.cwd(), 'content/blog'),
): Post[] {
  const cached = cache.get(dir);
  if (cached) return cached;
  const posts: Post[] = [];
  for (const yyyy of dirs(dir))
    for (const mm of dirs(path.join(dir, yyyy)))
      for (const dd of dirs(path.join(dir, yyyy, mm)))
        for (const name of fs.readdirSync(path.join(dir, yyyy, mm, dd))) {
          if (name.startsWith('_') || !name.endsWith('.mdx')) continue;
          const slug = name.slice(0, -'.mdx'.length);
          posts.push(
            readPost(path.join(dir, yyyy, mm, dd, name), {
              yyyy,
              mm,
              dd,
              slug,
            }),
          );
        }
  const sorted = sortNewestFirst(posts);
  cache.set(dir, sorted);
  return sorted;
}

export function getPost(p: PostParams): Post | undefined {
  return getPosts().find(
    (x) =>
      x.yyyy === p.yyyy && x.mm === p.mm && x.dd === p.dd && x.slug === p.slug,
  );
}
