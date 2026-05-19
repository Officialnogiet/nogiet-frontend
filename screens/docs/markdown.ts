import { marked, type Tokens } from 'marked';

export interface TocEntry {
  id: string;
  text: string;
  /** Heading depth — only h2 (2) and h3 (3) are surfaced in the TOC. */
  depth: 2 | 3;
}

export interface RenderedDoc {
  html: string;
  toc: TocEntry[];
}

/**
 * Slugify a heading the same way the renderer does, so TOC links match anchor ids.
 * Mirrors GitHub's algorithm closely enough for our docs.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Render a markdown document to themed HTML plus a flat table of contents.
 *
 * Decisions worth noting:
 * - Every heading gets a stable `id` and a clickable `#` anchor so users can deep-link.
 * - External links open in a new tab with `noopener`.
 * - `mermaid` fenced blocks are rendered as labelled code blocks (not diagrammed); we
 *   intentionally do NOT pull mermaid into the bundle — the markup is preserved so a
 *   future enhancement can render it lazily.
 * - Tables, blockquotes, lists, and inline code are unstyled here on purpose — the
 *   surrounding `.docs-prose` class in the Docs screen owns the visual design.
 */
export function renderMarkdown(source: string): RenderedDoc {
  const toc: TocEntry[] = [];
  const idCounts = new Map<string, number>();

  const renderer = new marked.Renderer();

  renderer.heading = ({ tokens, depth }: Tokens.Heading) => {
    const text = tokens.map((t) => ('text' in t ? (t.text as string) : '')).join('');
    let id = slugify(text);
    if (!id) id = `heading-${toc.length + 1}`;
    const count = idCounts.get(id) ?? 0;
    if (count > 0) id = `${id}-${count}`;
    idCounts.set(id, count + 1);

    if (depth === 2 || depth === 3) {
      toc.push({ id, text, depth: depth as 2 | 3 });
    }

    const inner = marked.parseInline(text) as string;
    return `<h${depth} id="${id}" class="docs-heading docs-heading-${depth}"><a href="#${id}" class="docs-heading-anchor" aria-label="Link to ${text}">#</a>${inner}</h${depth}>\n`;
  };

  renderer.link = ({ href, title, tokens }: Tokens.Link) => {
    const text = (marked.parser(tokens) as string).replace(/<\/?p>/g, '');
    const isExternal = /^https?:\/\//i.test(href);
    const titleAttr = title ? ` title="${title}"` : '';
    const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${href}"${titleAttr}${targetAttr} class="docs-link">${text}</a>`;
  };

  renderer.code = ({ text, lang }: Tokens.Code) => {
    const langLabel = (lang ?? '').trim();
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const label = langLabel
      ? `<div class="docs-code-label">${langLabel}</div>`
      : '';
    return `<div class="docs-code-block">${label}<pre><code>${escaped}</code></pre></div>\n`;
  };

  renderer.table = ({ header, rows }: Tokens.Table) => {
    const head = header
      .map((cell) => {
        const content = marked.parseInline(cell.text) as string;
        const align = cell.align ? ` style="text-align:${cell.align}"` : '';
        return `<th${align}>${content}</th>`;
      })
      .join('');
    const body = rows
      .map((row) => {
        const cells = row
          .map((cell) => {
            const content = marked.parseInline(cell.text) as string;
            const align = cell.align ? ` style="text-align:${cell.align}"` : '';
            return `<td${align}>${content}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');
    return `<div class="docs-table-wrap"><table class="docs-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>\n`;
  };

  const html = marked.parse(source, {
    renderer,
    gfm: true,
    breaks: false,
    async: false,
  }) as string;

  return { html, toc };
}
