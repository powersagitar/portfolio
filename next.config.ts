import type { NextConfig } from 'next';

import createMDX from '@next/mdx';

import { POSTS_SECTION, sectionHref } from './src/lib/sections';

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  async redirects() {
    return [
      {
        source: '/blog',
        destination: sectionHref(POSTS_SECTION),
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

// Turbopack needs plugins by name with serialisable options.
const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-frontmatter', 'remark-gfm'],
    rehypePlugins: [
      'rehype-slug',
      ['rehype-autolink-headings', { behavior: 'wrap' }],
      [
        'rehype-pretty-code',
        { theme: 'github-dark-default', keepBackground: false },
      ],
      [
        'rehype-external-links',
        { target: '_blank', rel: ['noopener', 'noreferrer'] },
      ],
    ],
  },
});

export default withMDX(nextConfig);
