import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/post-meta';
import { getPosts } from '@/lib/posts';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/` },
    ...getPosts().map((p) => ({
      url: `${SITE_URL}${p.path}`,
      lastModified: p.lastEdited ?? p.publishDate,
    })),
  ];
}
