/**
 * Imports Jack's product review posts from the TSP WordPress API.
 *
 * Jack posts "Item of the Day" style reviews under specific WP categories.
 * We page through those posts, extract title, excerpt, featured image,
 * permalink, and then auto-tag each product against the zone/track keyword
 * maps already defined in zones.ts and tracks.ts.
 */

import { logger } from "../logger";
import { ZONES } from "../zones";

const WP_BASE = "https://www.thesurvivalpodcast.com/wp-json/wp/v2";
const FETCH_TIMEOUT_MS = 30_000;
const PAGE_SIZE = 50;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 1000;

type WPRendered = { rendered?: string } | string | undefined | null;
type WPPost = {
  id: number;
  slug: string;
  link: string;
  title: WPRendered;
  excerpt: WPRendered;
  content: WPRendered;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      media_details?: { sizes?: Record<string, { source_url: string }> };
    }>;
  };
};

type WPCategory = { id: number; slug: string; name: string };
type WPTag = { id: number; slug: string; name: string };

async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string): Promise<{ data: T; headers: Headers }> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "TSP-Library/1.0 (+replit)",
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const data = (await res.json()) as T;
        return { data, headers: res.headers };
      }
      if (res.status === 400 || res.status === 404) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      lastErr = new Error(`HTTP ${res.status}`);
      if (attempt < RETRY_ATTEMPTS) await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
    } catch (err) {
      lastErr = err;
      if (attempt < RETRY_ATTEMPTS) await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
      else throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("WP product fetch failed");
}

function rendered(value: WPRendered): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.rendered ?? "";
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;|&apos;/g, "'")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&rsquo;|&#8217;/g, "'")
    .replace(/&lsquo;|&#8216;/g, "'")
    .replace(/&ldquo;|&#8220;/g, "\u201c")
    .replace(/&rdquo;|&#8221;/g, "\u201d")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<\/(p|div|li|h\d|br)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Find the category IDs that correspond to product reviews on TSP.
 * We look for slugs like "item-of-the-day", "tsp-az", "product-review", etc.
 */
async function findProductCategoryIds(): Promise<number[]> {
  const PRODUCT_CATEGORY_SLUGS = [
    "item-of-the-day",
    "tsp-az",
    "tspaz",
    "product-review",
    "product-reviews",
    "gear-review",
    "gear-reviews",
    "daily-item",
  ];

  try {
    const { data } = await fetchJson<WPCategory[]>(
      `${WP_BASE}/categories?per_page=100&_fields=id,slug,name`,
    );
    const ids: number[] = [];
    for (const cat of data) {
      if (PRODUCT_CATEGORY_SLUGS.includes(cat.slug.toLowerCase())) {
        ids.push(cat.id);
        logger.info({ id: cat.id, slug: cat.slug, name: cat.name }, "WP product category found");
      }
    }
    return ids;
  } catch (err) {
    logger.warn({ err }, "Could not fetch WP categories for product import");
    return [];
  }
}

/**
 * Build a keyword → zone-slug map from the ZONES definition.
 * Lowercased keywords that indicate zone membership.
 */
function buildZoneKeywordMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const zone of ZONES) {
    for (const tag of zone.tags) {
      map.set(tag.toLowerCase(), zone.slug);
    }
    for (const cat of zone.categories) {
      map.set(cat.toLowerCase(), zone.slug);
    }
  }
  return map;
}

/**
 * Map a set of WP category/tag names to zone slugs and category tags
 * using keyword matching against zones and tracks.
 */
function autoTag(
  wpCategories: string[],
  wpTags: string[],
  zoneKeywordMap: Map<string, string>,
): { zoneTags: string[]; categoryTags: string[] } {
  const combined = [...wpCategories, ...wpTags].map((s) => s.toLowerCase());
  const zoneSet = new Set<string>();
  const catSet = new Set<string>();

  for (const keyword of combined) {
    const zone = zoneKeywordMap.get(keyword);
    if (zone) zoneSet.add(zone);
    // Keep cleaned category names for tag-matching
    catSet.add(keyword);
  }

  return {
    zoneTags: Array.from(zoneSet),
    categoryTags: Array.from(catSet),
  };
}

/**
 * Extract the best available image URL from a WP post with _embedded media.
 */
function extractImageUrl(post: WPPost): string | null {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) return null;
  const sizes = media.media_details?.sizes;
  if (sizes) {
    const preferred = sizes["medium_large"] || sizes["medium"] || sizes["large"] || sizes["full"];
    if (preferred?.source_url) return preferred.source_url;
  }
  return media.source_url ?? null;
}

export type ProductImportResult = {
  seen: number;
  upserted: number;
  failedPages: number[];
};

export type ProductInsert = {
  wpPostId: number;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  externalUrl: string;
  zoneTags: string[];
  categoryTags: string[];
};

/**
 * Page through TSP WordPress API product review posts and yield batches
 * to the provided upsert function.
 */
export async function importProductReviews(options: {
  signal?: AbortSignal;
  upsertBatch: (items: ProductInsert[]) => Promise<number>;
}): Promise<ProductImportResult> {
  const { signal, upsertBatch } = options;

  const [categoryIds] = await Promise.all([findProductCategoryIds()]);

  if (categoryIds.length === 0) {
    logger.warn("No product review categories found — will import from all posts with product-like tags");
  }

  const zoneKeywordMap = buildZoneKeywordMap();

  // Fetch all tags once for name lookup
  let tagMap = new Map<number, { slug: string; name: string }>();
  let catMap = new Map<number, { slug: string; name: string }>();
  try {
    const [tagRes, catRes] = await Promise.all([
      fetchJson<WPTag[]>(`${WP_BASE}/tags?per_page=100&_fields=id,slug,name`),
      fetchJson<WPCategory[]>(`${WP_BASE}/categories?per_page=100&_fields=id,slug,name`),
    ]);
    for (const t of tagRes.data) tagMap.set(t.id, { slug: t.slug, name: t.name });
    for (const c of catRes.data) catMap.set(c.id, { slug: c.slug, name: c.name });
  } catch (err) {
    logger.warn({ err }, "Could not prefetch WP tags/categories for product import");
  }

  let page = 1;
  let totalPages = 1;
  let seen = 0;
  let upserted = 0;
  const failedPages: number[] = [];

  // Build the category filter if we found category IDs
  const catFilter = categoryIds.length > 0 ? `&categories=${categoryIds.join(",")}` : "";
  const fields = "id,slug,link,title,excerpt,content,categories,tags,featured_media";

  while (true) {
    if (signal?.aborted) break;
    const url = `${WP_BASE}/posts?per_page=${PAGE_SIZE}&page=${page}&_fields=${fields}&_embed=wp:featuredmedia${catFilter}`;
    try {
      const { data, headers } = await fetchJson<WPPost[]>(url);
      totalPages = Number(headers.get("x-wp-totalpages") ?? totalPages.toString());

      const items: ProductInsert[] = data.map((post) => {
        const rawTitle = decodeEntities(stripHtml(rendered(post.title))).trim();
        const description = stripHtml(rendered(post.excerpt)).slice(0, 400).trim();
        const imageUrl = extractImageUrl(post);

        const postCatNames = (post.categories ?? [])
          .map((id) => catMap.get(id)?.name ?? "")
          .filter(Boolean);
        const postTagNames = (post.tags ?? [])
          .map((id) => tagMap.get(id)?.name ?? "")
          .filter(Boolean);

        const { zoneTags, categoryTags } = autoTag(postCatNames, postTagNames, zoneKeywordMap);

        return {
          wpPostId: post.id,
          slug: post.slug || `product-${post.id}`,
          title: rawTitle,
          description,
          imageUrl,
          externalUrl: post.link,
          zoneTags,
          categoryTags,
        };
      });

      const written = await upsertBatch(items);
      seen += data.length;
      upserted += written;
      logger.info({ page, totalPages, seen, upserted }, "WP product page imported");
      if (page >= totalPages || data.length === 0) break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ page, err: msg }, "WP product page failed; skipping");
      failedPages.push(page);
      if (failedPages.length > 5) {
        logger.error("Too many failed product pages; aborting import");
        break;
      }
    }
    page++;
    if (page > 100) break;
  }

  return { seen, upserted, failedPages };
}
