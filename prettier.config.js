/** @type {import("prettier").Config} */
const config = {
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  importOrder: [
    '^(react|react-dom)(/.*)?$',
    '^(next)(/.*)?$',
    '<THIRD_PARTY_MODULES>',
    '^@/',
    '^@content/',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: { printWidth: 80, proseWrap: 'always' },
    },
  ],
};

export default config;
