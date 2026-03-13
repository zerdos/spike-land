import type { PrdDefinition } from "../../core-logic/types.js";

export const storeCategoryRoute: PrdDefinition = {
  id: "route:/store/:category",
  level: "route",
  name: "Store Category",
  summary:
    "Category detail pages with app grid, filtering by tags/pricing/rating, sorting, and featured app shelf per category",
  purpose:
    "Browsable store category pages. Each opens with a featured shelf of top apps then a filterable, sortable grid. Filters: tags, pricing model (free/paid/freemium), minimum rating. Sort: relevance, newest, top-rated, trending.",
  constraints: [
    "Category slug must match a valid entry in the store category manifest",
    "Filtering is client-side for result sets under 200 apps; server-side pagination for larger sets",
    "Featured shelf populated by store curator data — not user-generated",
    "Rating displayed is the aggregate of verified installs only",
    "Price filter must handle free, one-off, and subscription pricing models",
  ],
  acceptance: [
    "Each valid category URL renders a page with title, description, and app grid",
    "Applying a tag filter updates the grid without full page reload",
    "Sorting by 'top-rated' reorders grid in descending rating order",
    "Featured shelf shows 3–6 apps distinct from the main grid",
    "Invalid category slug returns a 404 with suggested categories",
  ],
  toolCategories: ["store-browse", "store-filter", "store-sort"],
  tools: [
    "store_list_categories",
    "store_get_category_apps",
    "store_get_featured_apps",
    "store_filter_apps",
    "store_sort_apps",
  ],
  composesFrom: ["platform", "route:/apps"],
  routePatterns: ["/store", "/store/:category"],
  keywords: [
    "store",
    "category",
    "browse",
    "filter",
    "sort",
    "rating",
    "pricing",
    "discovery",
    "featured",
    "tags",
  ],
  tokenEstimate: 240,
  version: "1.0.0",
};
