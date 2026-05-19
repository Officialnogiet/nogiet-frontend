// All NOGIET documentation bundled as raw strings via Vite's `?raw` import.
// This avoids HTTP fetches at runtime and guarantees the docs ship with the build,
// including the PWA offline cache. Adding a new .md file = add one entry below.

import overview from '../../docs/demo/00-overview.md?raw';
import loginAuth from '../../docs/demo/01-login-and-auth.md?raw';
import dashboardHome from '../../docs/demo/02-dashboard-home.md?raw';
import liveMap from '../../docs/demo/03-live-map.md?raw';
import methaneTrends from '../../docs/demo/04-methane-trends.md?raw';
import dataComparison from '../../docs/demo/05-data-comparison.md?raw';
import dataExplorer from '../../docs/demo/06-data-explorer.md?raw';
import manageData from '../../docs/demo/07-manage-data.md?raw';
import alerts from '../../docs/demo/08-alerts.md?raw';
import fieldData from '../../docs/demo/09-field-data.md?raw';
import userManagement from '../../docs/demo/10-user-management.md?raw';
import settings from '../../docs/demo/11-settings.md?raw';
import integrations from '../../docs/demo/12-integrations.md?raw';
import architecture from '../../docs/demo/13-architecture.md?raw';
import demoReadme from '../../docs/demo/README.md?raw';
import features from '../../docs/FEATURES.md?raw';
import imeoIntegration from '../../docs/IMEO_INTEGRATION.md?raw';

export type DocGroupId = 'getting-started' | 'walkthrough' | 'reference';

export interface DocGroup {
  id: DocGroupId;
  label: string;
  description: string;
}

export const DOC_GROUPS: DocGroup[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    description: 'High-level overview and how to run the demo.',
  },
  {
    id: 'walkthrough',
    label: 'Screen-by-Screen Walkthrough',
    description: 'A narrative tour of every screen in the portal.',
  },
  {
    id: 'reference',
    label: 'Technical Reference',
    description: 'Feature tracker and provider integration details.',
  },
];

export interface DocPage {
  /** URL-safe slug used in the in-app docs router. */
  slug: string;
  /** Display title shown in the nav and the page header. */
  title: string;
  /** One-line description used in the cards on the docs landing page. */
  summary: string;
  /** Section in the left nav. */
  group: DocGroupId;
  /** Estimated reading time in minutes (rounded). */
  readingTime: number;
  /** Raw markdown source. */
  source: string;
}

function estimateReadingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

// Ordered exactly the way the demo is presented. The first item in `pages`
// is also used as the default landing page when /docs is opened.
const RAW_PAGES: Omit<DocPage, 'readingTime'>[] = [
  {
    slug: 'overview',
    title: 'What NOGIET is and why it matters',
    summary: 'The one-page elevator pitch — the problem, the users, what success looks like.',
    group: 'getting-started',
    source: overview,
  },
  {
    slug: 'demo-readme',
    title: 'How to run a live demo',
    summary: 'The presenter playbook — running order, conventions, and how to start the stack.',
    group: 'getting-started',
    source: demoReadme,
  },
  {
    slug: 'login-and-auth',
    title: 'Login & Authentication',
    summary: 'Email/password sign-in, OTP reset flow, and role-based redirects.',
    group: 'walkthrough',
    source: loginAuth,
  },
  {
    slug: 'dashboard-home',
    title: 'Dashboard Home',
    summary: 'KPI cards, 7-day per-source trend, top emitters, alerts, and data-source health.',
    group: 'walkthrough',
    source: dashboardHome,
  },
  {
    slug: 'live-map',
    title: 'Live Map — the crown jewel',
    summary: 'Square emissions grid, per-source plumes, filters, layers, and drill-in.',
    group: 'walkthrough',
    source: liveMap,
  },
  {
    slug: 'methane-trends',
    title: 'Methane Trends',
    summary: 'Long-term trends per feed and annual statistics by state, region, or facility.',
    group: 'walkthrough',
    source: methaneTrends,
  },
  {
    slug: 'data-comparison',
    title: 'Data Comparison',
    summary: 'Reconciling ground-truth measurements against satellite detections per facility.',
    group: 'walkthrough',
    source: dataComparison,
  },
  {
    slug: 'data-explorer',
    title: 'Data Explorer',
    summary: 'Tabular browser for sources, emission rates, cumulative totals, and aggregations.',
    group: 'walkthrough',
    source: dataExplorer,
  },
  {
    slug: 'manage-data',
    title: 'Manage Data',
    summary: 'Add, edit, and remove facilities; configure thresholds; submit ground readings.',
    group: 'walkthrough',
    source: manageData,
  },
  {
    slug: 'alerts',
    title: 'Alerts',
    summary: 'Severity-prioritised alert dashboard with email + SMS notifications.',
    group: 'walkthrough',
    source: alerts,
  },
  {
    slug: 'field-data',
    title: 'Field Data Collection',
    summary: 'Mobile-first form for facility owners with offline queue and photo upload.',
    group: 'walkthrough',
    source: fieldData,
  },
  {
    slug: 'user-management',
    title: 'User Management',
    summary: 'Roles (Super Admin / Admin / Member / Facility Owner) and team workflows.',
    group: 'walkthrough',
    source: userManagement,
  },
  {
    slug: 'settings',
    title: 'Settings',
    summary: 'Personal preferences, units, dark mode, map theme, and alert thresholds.',
    group: 'walkthrough',
    source: settings,
  },
  {
    slug: 'integrations',
    title: 'Satellite Integrations',
    summary: 'Carbon Mapper, IMEO V2, and TROPOMI — what we ingest and how we authenticate.',
    group: 'reference',
    source: integrations,
  },
  {
    slug: 'architecture',
    title: 'Architecture',
    summary: 'High-level system diagram, frontend/backend stack, and where data lives.',
    group: 'reference',
    source: architecture,
  },
  {
    slug: 'features',
    title: 'Feature Tracker',
    summary: 'Every feature from the client blueprint with completion status.',
    group: 'reference',
    source: features,
  },
  {
    slug: 'imeo-integration',
    title: 'IMEO Integration Deep-Dive',
    summary: 'How UNEP Eye on Methane plumes are pulled, cached, and merged with other feeds.',
    group: 'reference',
    source: imeoIntegration,
  },
];

export const DOC_PAGES: DocPage[] = RAW_PAGES.map((p) => ({
  ...p,
  readingTime: estimateReadingTime(p.source),
}));

export function getDocBySlug(slug: string): DocPage | undefined {
  return DOC_PAGES.find((p) => p.slug === slug);
}

export function getDocsByGroup(group: DocGroupId): DocPage[] {
  return DOC_PAGES.filter((p) => p.group === group);
}

export const DEFAULT_DOC_SLUG = DOC_PAGES[0]?.slug ?? 'overview';
