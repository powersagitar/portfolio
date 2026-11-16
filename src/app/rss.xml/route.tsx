import type { ReactNode } from 'react';

import { buildFeed } from '@/lib/feed';
import { SITE_URL } from '@/lib/post-meta';
import { getPosts } from '@/lib/posts';
import { renderToStaticMarkup } from '@/lib/render-static';

export const dynamic = 'force-static';

// Keep in sync with src/mdx-components.tsx: the feed renders Callout as a
// plain blockquote because feed readers have no site CSS.
const components = {
  Callout: ({ children }: { children?: ReactNode }) => (
    <blockquote>{children}</blockquote>
  ),
};

export async function GET() {
  const posts = getPosts();
  const html: Record<string, string> = {};
  for (const { yyyy, mm, dd, slug, path } of posts) {
    const { default: Body } = await import(
      `@content/blog/${yyyy}/${mm}/${dd}/${slug}.mdx`
    );
    html[path] = renderToStaticMarkup(<Body components={components} />);
  }
  return new Response(buildFeed(posts, html, SITE_URL), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
