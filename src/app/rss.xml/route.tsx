import { buildFeed } from '@/lib/feed';
import { feedComponents } from '@/lib/feed-components';
import { SITE_URL } from '@/lib/post-meta';
import { getPosts } from '@/lib/posts';
import { renderToStaticMarkup } from '@/lib/render-static';

export const dynamic = 'force-static';

export async function GET() {
  const posts = getPosts();
  const html: Record<string, string> = {};
  for (const { yyyy, mm, dd, slug, path } of posts) {
    const { default: Body } = await import(
      `@content/blog/${yyyy}/${mm}/${dd}/${slug}.mdx`
    );
    html[path] = renderToStaticMarkup(<Body components={feedComponents} />);
  }
  return new Response(buildFeed(posts, html, SITE_URL), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
