import { describe, expect, test } from 'bun:test';

import { feedComponents } from './feed-components';
import { renderToStaticMarkup } from './render-static';

const { a: A, pre: Pre, Callout } = feedComponents;

describe('feedComponents', () => {
  test('heading # link renders nothing (string or array className)', () => {
    expect(renderToStaticMarkup(<A className="anc mono" href="#x" />)).toBe('');
    expect(
      renderToStaticMarkup(<A className={['anc', 'mono']} href="#x" />),
    ).toBe('');
  });
  test('ordinary link stays a plain anchor', () => {
    expect(renderToStaticMarkup(<A href="https://e.com">hi</A>)).toBe(
      '<a href="https://e.com">hi</a>',
    );
  });
  test('pre is plain, without code block chrome', () => {
    const out = renderToStaticMarkup(
      <Pre data-language="cpp">
        <code>x</code>
      </Pre>,
    );
    expect(out).toContain('<pre');
    expect(out).not.toContain('class="lang');
    expect(out).not.toContain('codeblk');
  });
  test('Callout is a plain blockquote', () => {
    expect(renderToStaticMarkup(<Callout>n</Callout>)).toBe(
      '<blockquote>n</blockquote>',
    );
  });
});
