import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Search,
  ArrowUp,
  ChevronRight,
  Menu,
  X,
  Clock,
  Rocket,
  Compass,
  Wrench,
} from 'lucide-react';
import {
  DEFAULT_DOC_SLUG,
  DOC_GROUPS,
  DOC_PAGES,
  type DocGroupId,
  type DocPage,
  getDocBySlug,
  getDocsByGroup,
} from './manifest';
import { renderMarkdown, type TocEntry } from './markdown';

interface DocsProps {
  darkMode: boolean;
}

const GROUP_ICON: Record<DocGroupId, React.ComponentType<{ size?: number; className?: string }>> = {
  'getting-started': Rocket,
  walkthrough: Compass,
  reference: Wrench,
};

const Docs: React.FC<DocsProps> = ({ darkMode }) => {
  const dm = darkMode;
  const [activeSlug, setActiveSlug] = useState<string>(DEFAULT_DOC_SLUG);
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeDoc: DocPage = useMemo(
    () => getDocBySlug(activeSlug) ?? getDocBySlug(DEFAULT_DOC_SLUG)!,
    [activeSlug],
  );

  const rendered = useMemo(() => renderMarkdown(activeDoc.source), [activeDoc.source]);

  // Filter the nav by the current search query. We match against title, summary, and
  // the raw markdown so users searching for jargon like "Cloudflare" land on the page.
  const filteredPages: DocPage[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOC_PAGES;
    return DOC_PAGES.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.source.toLowerCase().includes(q),
    );
  }, [query]);

  // Track which heading the user is currently reading, so the right-hand TOC can
  // highlight it. We use IntersectionObserver against the rendered headings.
  useEffect(() => {
    const root = scrollRef.current;
    const container = contentRef.current;
    if (!root || !container) return;
    const headingEls = Array.from(
      container.querySelectorAll<HTMLElement>('h2[id], h3[id]'),
    );
    if (headingEls.length === 0) {
      setActiveHeading('');
      return;
    }
    setActiveHeading(headingEls[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        // Prefer the topmost heading that has entered the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveHeading((visible[0].target as HTMLElement).id);
        }
      },
      {
        root,
        rootMargin: '0px 0px -70% 0px',
        threshold: 0,
      },
    );
    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rendered.html]);

  // Reset scroll + close mobile drawer when the user switches docs.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    setNavOpen(false);
  }, [activeSlug]);

  // Intercept in-document anchor clicks so we smooth-scroll within the scroll container
  // instead of doing a full page jump (which doesn't work because our content scrolls,
  // not the body).
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const id = anchor.getAttribute('href')!.slice(1);
      const el = container.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
      if (!el) return;
      e.preventDefault();
      const scroller = scrollRef.current;
      if (scroller) {
        const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 16;
        scroller.scrollTo({ top, behavior: 'smooth' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      history.replaceState(null, '', `#${id}`);
    };
    container.addEventListener('click', handler);
    return () => container.removeEventListener('click', handler);
  }, [rendered.html]);

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToHeading = (id: TocEntry['id']) => {
    const container = contentRef.current;
    const scroller = scrollRef.current;
    if (!container || !scroller) return;
    const el = container.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 16;
    scroller.scrollTo({ top, behavior: 'smooth' });
  };

  const groupedFilter = (group: DocGroupId): DocPage[] =>
    filteredPages.filter((p) => p.group === group);

  // Visible groups when filtering — only show a group header if it has matches.
  const visibleGroups = useMemo(
    () => DOC_GROUPS.filter((g) => groupedFilter(g.id).length > 0),
    [filteredPages],
  );

  // Tokens (theme + a little design system local to the docs screen).
  const surface = dm ? 'bg-[#0b0e14]' : 'bg-gray-50';
  const card = dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-200';
  const subtle = dm ? 'text-gray-400' : 'text-gray-500';
  const navItemIdle = dm ? 'text-gray-400 hover:bg-white/5 hover:text-gray-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
  const navItemActive = dm ? 'bg-[#009688]/15 text-[#34D1BF]' : 'bg-[#009688]/10 text-[#00796B]';

  return (
    <div className={`h-full flex flex-col ${surface}`}>
      {/* Header bar — same teal-on-neutral pattern as the rest of the app. */}
      <header className={`border-b ${dm ? 'border-[#1e2430]' : 'border-gray-200'} px-4 md:px-8 py-4 flex items-center gap-3`}>
        <button
          onClick={() => setNavOpen((v) => !v)}
          className={`lg:hidden p-2 rounded-lg ${dm ? 'bg-[#12161f] border border-[#1e2430] text-gray-300' : 'bg-white border border-gray-200 text-gray-700'}`}
          aria-label="Toggle docs nav"
        >
          {navOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
        <div className="w-9 h-9 rounded-xl bg-[#009688]/15 flex items-center justify-center text-[#009688]">
          <BookOpen size={18} />
        </div>
        <div className="min-w-0">
          <h1 className={`text-base md:text-lg font-bold leading-tight ${dm ? 'text-white' : 'text-gray-900'}`}>
            NOGIET Documentation
          </h1>
          <p className={`text-[11px] md:text-xs ${subtle} truncate`}>
            Page-by-page walkthrough of the portal, satellite integrations, and architecture.
          </p>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* LEFT NAV --------------------------------------------------------- */}
        <aside
          className={`
            ${navOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
            fixed lg:static inset-y-0 left-0 z-40 lg:z-0
            w-80 lg:w-72 xl:w-80 flex-shrink-0
            border-r ${dm ? 'border-[#1e2430] bg-[#0b0e14]' : 'border-gray-200 bg-white'}
            transition-transform duration-200 ease-out
            flex flex-col
          `}
        >
          <div className={`p-4 border-b ${dm ? 'border-[#1e2430]' : 'border-gray-200'}`}>
            <div className={`relative`}>
              <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subtle}`} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the docs"
                className={`
                  w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition
                  ${dm
                    ? 'bg-[#12161f] border border-[#1e2430] text-gray-100 placeholder:text-gray-500 focus:border-[#009688]/60'
                    : 'bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-[#009688]/60 focus:bg-white'}
                `}
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {visibleGroups.length === 0 && (
              <p className={`text-sm px-3 ${subtle}`}>No pages match &ldquo;{query}&rdquo;.</p>
            )}
            {visibleGroups.map((group) => {
              const Icon = GROUP_ICON[group.id];
              const pages = groupedFilter(group.id);
              return (
                <div key={group.id}>
                  <div className="px-3 mb-2 flex items-center gap-2">
                    <Icon size={12} className="text-[#009688]" />
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${subtle}`}>
                      {group.label}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    {pages.map((page) => {
                      const isActive = page.slug === activeSlug;
                      return (
                        <button
                          key={page.slug}
                          onClick={() => setActiveSlug(page.slug)}
                          className={`
                            w-full text-left px-3 py-2 rounded-lg flex items-start gap-2.5
                            text-sm transition-all
                            ${isActive ? navItemActive : navItemIdle}
                          `}
                        >
                          <span
                            className={`mt-1 w-1 h-1 rounded-full flex-shrink-0 ${
                              isActive ? 'bg-[#009688]' : dm ? 'bg-gray-700' : 'bg-gray-300'
                            }`}
                          />
                          <span className={`leading-snug ${isActive ? 'font-semibold' : 'font-medium'}`}>
                            {page.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Click-away scrim for the mobile drawer. */}
        {navOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/40"
            onClick={() => setNavOpen(false)}
          />
        )}

        {/* MIDDLE — rendered doc -------------------------------------------- */}
        <div ref={scrollRef} className="flex-1 min-w-0 overflow-y-auto relative">
          <article className="max-w-3xl mx-auto px-5 md:px-10 py-8 md:py-12">
            {/* Page header card with breadcrumb + meta */}
            <div className={`p-5 md:p-6 rounded-2xl border ${card} mb-8`}>
              <div className={`flex items-center gap-2 text-[11px] uppercase tracking-widest ${subtle} mb-2`}>
                <span>Docs</span>
                <ChevronRight size={10} />
                <span className="text-[#009688] font-semibold">
                  {DOC_GROUPS.find((g) => g.id === activeDoc.group)?.label}
                </span>
              </div>
              <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${dm ? 'text-white' : 'text-gray-900'}`}>
                {activeDoc.title}
              </h2>
              <p className={`mt-2 text-sm md:text-base leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeDoc.summary}
              </p>
              <div className={`mt-4 flex items-center gap-4 text-xs ${subtle}`}>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  {activeDoc.readingTime} min read
                </span>
                <span>·</span>
                <span className="font-mono text-[11px]">{activeDoc.slug}.md</span>
              </div>
            </div>

            <div
              ref={contentRef}
              className={`docs-prose ${dm ? 'docs-prose-dark' : 'docs-prose-light'}`}
              dangerouslySetInnerHTML={{ __html: rendered.html }}
            />

            {/* Prev / next navigation at the foot of every page. */}
            <PageFooter
              active={activeDoc}
              onNavigate={setActiveSlug}
              dm={dm}
            />
          </article>

          {/* Floating "back to top" */}
          <button
            onClick={scrollToTop}
            className={`
              fixed bottom-24 lg:bottom-8 right-6 z-30
              w-10 h-10 rounded-full shadow-lg flex items-center justify-center
              transition-all hover:scale-110 active:scale-95
              ${dm ? 'bg-[#1a1f2b] text-gray-300 border border-[#2d364a]' : 'bg-white text-gray-600 border border-gray-200'}
            `}
            aria-label="Scroll to top"
            title="Back to top"
          >
            <ArrowUp size={16} />
          </button>
        </div>

        {/* RIGHT — TOC ------------------------------------------------------ */}
        <aside className={`hidden xl:block w-64 flex-shrink-0 border-l ${dm ? 'border-[#1e2430]' : 'border-gray-200'}`}>
          <div className="sticky top-0 px-5 py-8">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${subtle} mb-3`}>
              On this page
            </p>
            {rendered.toc.length === 0 && (
              <p className={`text-xs ${subtle}`}>No sections.</p>
            )}
            <ul className="space-y-1">
              {rendered.toc.map((entry) => {
                const isActive = entry.id === activeHeading;
                return (
                  <li key={entry.id} className={entry.depth === 3 ? 'pl-3' : ''}>
                    <button
                      onClick={() => scrollToHeading(entry.id)}
                      className={`
                        block w-full text-left text-xs leading-snug py-1.5 px-2 rounded
                        transition-colors
                        ${isActive
                          ? 'text-[#009688] font-semibold'
                          : dm
                            ? 'text-gray-500 hover:text-gray-200'
                            : 'text-gray-500 hover:text-gray-800'}
                      `}
                    >
                      {entry.text}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

/** Prev / next pager. Cycles through DOC_PAGES in the manifest order. */
const PageFooter: React.FC<{
  active: DocPage;
  onNavigate: (slug: string) => void;
  dm: boolean;
}> = ({ active, onNavigate, dm }) => {
  const idx = DOC_PAGES.findIndex((p) => p.slug === active.slug);
  const prev = idx > 0 ? DOC_PAGES[idx - 1] : null;
  const next = idx >= 0 && idx < DOC_PAGES.length - 1 ? DOC_PAGES[idx + 1] : null;

  if (!prev && !next) return null;
  const card = dm
    ? 'bg-[#12161f] border-[#1e2430] hover:border-[#009688]/40 text-gray-200'
    : 'bg-white border-gray-200 hover:border-[#009688]/40 text-gray-800';

  return (
    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {prev ? (
        <button
          onClick={() => onNavigate(prev.slug)}
          className={`group p-4 rounded-xl border text-left transition-all ${card}`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
            ← Previous
          </p>
          <p className="text-sm font-semibold leading-snug group-hover:text-[#009688]">{prev.title}</p>
        </button>
      ) : (
        <div />
      )}
      {next ? (
        <button
          onClick={() => onNavigate(next.slug)}
          className={`group p-4 rounded-xl border text-right transition-all ${card}`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
            Next →
          </p>
          <p className="text-sm font-semibold leading-snug group-hover:text-[#009688]">{next.title}</p>
        </button>
      ) : (
        <div />
      )}
    </div>
  );
};

export default Docs;
