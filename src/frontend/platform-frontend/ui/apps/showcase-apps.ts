export interface ShowcaseAppDetail {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  category?: string;
  tags?: string[];
  tagline?: string;
  pricing?: string;
  is_featured?: boolean;
  is_new?: boolean;
  status: string;
  tools: string[];
  graph: Record<string, unknown>;
  markdown: string;
  tool_count: number;
  sort_order: number;
}

const SHOWCASE_APPS: ShowcaseAppDetail[] = [
  {
    slug: "pages-template-chooser",
    name: "Pages Template Chooser",
    description:
      "A native-feeling macOS template gallery for Pages with premium upsell surfaces, dense category navigation, and polished selection states.",
    emoji: "📄",
    category: "Media & Creative",
    tags: ["macos", "pages", "templates", "design", "app-store"],
    tagline: "App Store quality template picking for Pages on macOS.",
    pricing: "free",
    is_featured: true,
    is_new: true,
    status: "live",
    tools: [],
    graph: {},
    markdown: `# Pages Template Chooser

An App Store quality template picker for Pages on macOS. The goal is not a generic file-open dialog. It should feel like a first-party creation surface with a calm sidebar, premium merchandising, and a dense but elegant preview grid.

## Product Intent

- make starting a document feel visual and low-friction
- organize a large template catalog without overwhelming the user
- create a clear premium upsell surface for Apple Creator Studio
- preserve familiar macOS interaction patterns: native title bar, sticky footer actions, scrollable content, strong keyboard behavior

## Core Surface

### Window shell

- native macOS title bar with traffic-light controls
- two-pane layout
- translucent left sidebar using macOS material treatment
- white right content surface with scrollable template grid
- sticky footer with \`Cancel\` and \`Create\`

### Sidebar categories

- All Templates
- Premium
- Basic
- Reports
- Education
- Certificates
- Organisers
- Newsletters
- Brochures
- Business
- Books
- Cards
- Posters & Flyers
- Letters
- Curricula Vitae
- Stationery
- Miscellaneous
`,
    tool_count: 0,
    sort_order: 5,
  },
];

export function getShowcaseAppSummaries(): ShowcaseAppDetail[] {
  return SHOWCASE_APPS;
}

export function getShowcaseAppDetail(slug: string): ShowcaseAppDetail | undefined {
  return SHOWCASE_APPS.find((app) => app.slug === slug);
}

export function mergeShowcaseApps<T extends { slug: string; sort_order: number }>(
  apps: T[],
  showcaseApps: T[],
): T[] {
  const deduped = new Map<string, T>();

  for (const app of apps) {
    deduped.set(app.slug, app);
  }

  for (const app of showcaseApps) {
    if (!deduped.has(app.slug)) {
      deduped.set(app.slug, app);
    }
  }

  return Array.from(deduped.values()).sort(
    (left, right) => left.sort_order - right.sort_order || left.slug.localeCompare(right.slug),
  );
}
