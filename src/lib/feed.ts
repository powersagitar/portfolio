import { Feed } from 'feed';

import type { Post } from './post-meta';

export function buildFeed(
  posts: Post[],
  html: Record<string, string>,
  baseUrl: string,
): string {
  const feed = new Feed({
    title: 'Mohan Dong',
    description: "Mohan's portfolio",
    id: baseUrl,
    link: baseUrl,
    copyright: '',
    feed: `${baseUrl}/rss.xml`,
    feedLinks: { rss2: `${baseUrl}/rss.xml` },
  });
  for (const post of posts) {
    const url = `${baseUrl}${post.path}`;
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.description,
      content: html[post.path],
      date: new Date(post.publishDate),
    });
  }
  return feed.rss2();
}
