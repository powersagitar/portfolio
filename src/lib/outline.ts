import GithubSlugger from 'github-slugger';
import matter from 'gray-matter';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toString } from 'mdast-util-to-string';

export type TocEntry = { id: string; label: string };

export type PostOutline = { sections: TocEntry[]; codeBlocks: number };

export function outlineFromMdx(source: string): PostOutline {
  const tree = fromMarkdown(matter(source).content);
  const slugger = new GithubSlugger();
  const sections: TocEntry[] = [];
  let codeBlocks = 0;

  const visit = (node: (typeof tree)['children'][number] | typeof tree) => {
    if (node.type === 'heading') {
      const label = toString(node);
      const id = slugger.slug(label);
      if (node.depth === 2) sections.push({ id, label });
    } else if (node.type === 'code') {
      codeBlocks += 1;
    }
    if ('children' in node) for (const child of node.children) visit(child);
  };
  visit(tree);

  return { sections, codeBlocks };
}
