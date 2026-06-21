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
  /** Optional episode tag filters for the "Find episodes" deep-link */
  filterTags?: string[];
};

export const TOPIC_CLUSTERS: TopicCluster[] = [
  {
    id: "grounding-earthing",
    label: "Grounding & Earthing",
    description:
      "Jack has returned to earthing more than almost any health topic in the TSP archive. Clint Ober's original research, the peer-reviewed work of Oschman and Chevalier, and the clinical perspectives of Sinatra and Koniver form a coherent body of science on barefoot contact, inflammation, and the body's relationship to the Earth's electric field. These seven researchers represent the full depth of that thread.",
    emoji: "🌱",
    zones: ["zone-0", "zone-1"],
    expertSlugs: [
      "clint-ober",
      "dr-stephen-sinatra",
      "dr-james-oschman",
      "dr-gaetan-chevalier",
      "dr-laura-koniver",
      "dr-joseph-mercola",
      "dr-zach-bush",
    ],
    filterTags: ["grounding", "earthing", "earthing institute"],
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
