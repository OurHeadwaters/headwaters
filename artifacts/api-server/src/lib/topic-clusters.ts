/**
 * Topic clusters for zone resource pages.
 * Each cluster groups a named set of expert slugs under a thematic label.
 * The cluster section renders on the zone detail page when at least one
 * matching expert is present in that zone.
 *
 * To add or remove experts from a cluster, update the `expertSlugs` array.
 * Expert slugs must match the `slug` column in the expert_council table.
 */

export type TopicCluster = {
  id: string;
  label: string;
  description: string;
  emoji: string;
  /** Zone slugs where this cluster section should appear */
  zones: string[];
  /** Expert council slugs that belong to this cluster */
  expertSlugs: string[];
};

export const TOPIC_CLUSTERS: TopicCluster[] = [
  {
    id: "grounding-earthing",
    label: "Grounding & Earthing",
    description:
      "Experts focused on reconnecting with the earth — barefoot earthing, soil-based health, circadian rhythm, and the physiological benefits of direct contact with natural environments.",
    emoji: "🌱",
    zones: ["zone-1", "zone-2"],
    expertSlugs: [
      "clint-ober",
      "james-oschman",
      "laura-koniver",
      "stephen-sinatra",
      "gaetan-chevalier",
      "scott-sullins",
      "david-wolfe",
    ],
  },
];

/**
 * Return clusters that apply to a given zone, filtered to only include
 * experts that are actually present in the provided expert list.
 */
export function clustersForZone(
  zoneSlug: string,
  zoneExperts: { id: string; slug?: string }[],
): Array<TopicCluster & { experts: { id: string; slug?: string }[] }> {
  const expertIds = new Set(zoneExperts.map((e) => e.id));

  return TOPIC_CLUSTERS.filter((c) => c.zones.includes(zoneSlug))
    .map((cluster) => {
      const clusterExperts = cluster.expertSlugs
        .filter((slug) => expertIds.has(slug))
        .map((slug) => zoneExperts.find((e) => e.id === slug)!)
        .filter(Boolean);
      return { ...cluster, experts: clusterExperts };
    })
    .filter((c) => c.experts.length > 0);
}
