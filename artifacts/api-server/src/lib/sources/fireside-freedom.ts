import { parseChannel } from "../rss";
import { logger } from "../logger";
import type { InsertContentItem } from "@workspace/db";

const FEED_URL = "https://feeds.captivate.fm/fireside-freedom/";
const SOURCE = "fireside-freedom";
const FETCH_TIMEOUT_MS = 30_000;

/**
 * Zone category tags applied to Fireside Freedom episodes based on
 * keyword matches in the episode title and description.
 *
 * Zone mapping:
 *   zone-0  — self-reliance, liberty, freedom, sovereignty, preparedness
 *   zone-1  — financial independence, off-grid economics, barter
 *   zone-2  — homesteading, gardening, livestock, food production
 *   zone-3  — food preservation, cooking, off-grid kitchen
 *   zone-4  — wilderness skills, bushcraft, hunting, fishing
 *   zone-5  — survival skills, emergency preparedness, first aid
 */
const ZONE_RULES: Array<{ zones: string[]; pattern: RegExp }> = [
  {
    zones: ["zone-0"],
    pattern:
      /\b(self.reli|liberty|freedom|sovere|patriot|constitution|civil.libert|decentrali|individual.rights?|voluntar|anarch|second.amend|gun.rights?|firearms?|2nd.amend)/i,
  },
  {
    zones: ["zone-0", "zone-1"],
    pattern:
      /\b(prepar(ed|ing|edness)|ready|resilience|self.suffici|independen|off.grid|off grid|bug.out|bug out|SHTF|TEOTWAWKI|grid.down|crisis|disaster|emergency)/i,
  },
  {
    zones: ["zone-1"],
    pattern:
      /\b(financ|econom|invest|bitcoin|crypto|barter|trade|bartering|money|wealth|debt.free|frugal|income|budget|tax)/i,
  },
  {
    zones: ["zone-2"],
    pattern:
      /\b(homestead|garden(ing)?|livestock|chicken|goat|pig|cow|cattle|sheep|rabbit|bee|apiar|farm(ing)?|permaculture|orchard|compost|soil|seeds?|plant(ing)?|grow(ing)?|harvest)/i,
  },
  {
    zones: ["zone-3"],
    pattern:
      /\b(food.preserv|canning|ferment|dehydrat|smoking|curing|cellar|larder|pantry|storag|food.storage|cook(ing)?|recipe|homestead.kitchen|bread|sourdough|lacto)/i,
  },
  {
    zones: ["zone-4"],
    pattern:
      /\b(wilderness|bushcraft|hunt(ing)?|fish(ing)?|trapping|forag(ing)?|wild.crafting|tracking|camp(ing)?|hiking|backpack|primitive.skills?|primitive skills|nature)/i,
  },
  {
    zones: ["zone-5"],
    pattern:
      /\b(surviv(al|ing)?|first.aid|medical|trauma|wound|bug.out|shelter|water.filter|purif|fire.starting|navigation|lost|signaling|rescue|edible.plants?)/i,
  },
];

function deriveZoneTags(title: string, summary: string): string[] {
  const text = `${title} ${summary}`;
  const zones = new Set<string>();
  for (const rule of ZONE_RULES) {
    if (rule.pattern.test(text)) {
      for (const z of rule.zones) zones.add(z);
    }
  }
  return Array.from(zones).sort();
}

export async function syncFiresideFreedom(opts: {
  upsertBatch: (items: InsertContentItem[]) => Promise<number>;
}): Promise<{ itemsSeen: number; itemsUpserted: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let xml: string;
  try {
    const res = await fetch(FEED_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "TSP-StompingPath/1.0 (+replit)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) throw new Error(`Fireside Freedom feed fetch failed: ${res.status}`);
    xml = await res.text();
  } finally {
    clearTimeout(timer);
  }

  const feed = parseChannel(xml);
  logger.info({ episodes: feed.totalEpisodes }, "Fetched Fireside Freedom RSS feed");

  const items: InsertContentItem[] = feed.episodes.map((ep) => {
    const zoneTags = deriveZoneTags(ep.title, ep.summary);
    return {
      source: SOURCE,
      sourceId: ep.guid,
      kind: "audio" as const,
      slug: `ff-${ep.slug}`,
      title: ep.title,
      link: ep.link,
      summary: ep.summary,
      bodyHtml: ep.descriptionHtml,
      bodyText: undefined,
      publishedAt: ep.pubDate ? new Date(ep.pubDate) : new Date(0),
      durationSeconds: ep.durationSeconds,
      audioUrl: ep.audioUrl,
      audioType: ep.audioType,
      videoUrl: null,
      videoId: null,
      artworkUrl: ep.artworkUrl,
      episodeNumber: ep.episodeNumber,
      categories: ep.categories,
      tags: ["fireside-freedom", ...zoneTags],
      extra: {},
    };
  });

  const itemsUpserted = await opts.upsertBatch(items);
  return { itemsSeen: items.length, itemsUpserted };
}
