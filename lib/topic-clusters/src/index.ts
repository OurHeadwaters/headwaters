/**
 * Topic clusters for zone resource pages.
 * Each cluster groups a named set of expert slugs under a thematic label.
 * The cluster section renders on the zone detail page when at least one
 * matching expert is present in that zone, and the cluster banner renders
 * on the episodes page when the active tag filters match a cluster.
 *
 * To add or remove experts from a cluster, update the `expertSlugs` array.
 * Expert slugs must match the `slug` column in the expert_council table.
 *
 * This is the single source of truth for cluster data — the api-server and
 * stomping-paths frontend both import from here so cluster definitions
 * (especially `filterTags`) never drift out of sync.
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
  /** Episode tag filters for the "Find episodes" deep-link (required for all clusters) */
  filterTags: string[];
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
  {
    id: "permaculture-food-systems",
    label: "Permaculture & Food Systems",
    description:
      "Joel Salatin, Paul Wheaton, Marjory Wildcraft, and Ben Falk have each built decades of practice around the idea that land, food, and community are inseparable. TSP's permaculture thread spans backyard gardens to full-scale farm design, with episodes on soil biology, forest gardens, aquaponics, livestock integration, and the ethics of permanent agriculture.",
    emoji: "🌿",
    zones: ["zone-2", "zone-3"],
    expertSlugs: [
      "joel-salatin",
      "paul-wheaton",
      "marjory-wildcraft",
      "ben-falk",
      "jack-spirko",
      "nate-erin-lamaster",
      "sam-nowak",
    ],
    filterTags: ["permaculture", "homesteading", "gardening", "aquaponics"],
  },
  {
    id: "personal-finance-resilience",
    label: "Personal Finance & Economic Resilience",
    description:
      "Debt freedom, sound money, and income diversification are foundational to every zone — but they're the whole game in Zone 0. Dave Ramsey's debt snowball, Chris Martenson's crash course on exponential money, and Chuck Taylor's practical investing lens give listeners a multi-angle attack on financial dependence that TSP has reinforced across hundreds of episodes.",
    emoji: "💰",
    zones: ["zone-0"],
    expertSlugs: [
      "dave-ramsey",
      "chris-martenson",
      "chuck-taylor",
      "steven-fowkes",
      "jack-spirko",
    ],
    filterTags: ["debt", "economics", "money", "investing", "economy"],
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

/**
 * Find the cluster whose filterTags exactly match the given set of active
 * tag filters (order-independent, case-insensitive). Used to show a cluster
 * banner on the episodes page when a listener's active filters line up with
 * a known topic cluster.
 */
export function matchCluster(
  tagFilter: string[],
  clusters: Pick<TopicCluster, "filterTags">[] = TOPIC_CLUSTERS,
): TopicCluster | null {
  if (tagFilter.length === 0 || clusters.length === 0) return null;
  const active = new Set(tagFilter.map((t) => t.toLowerCase()));
  for (const cluster of clusters as TopicCluster[]) {
    const clusterSet = new Set(cluster.filterTags.map((t) => t.toLowerCase()));
    const isMatch =
      active.size === clusterSet.size &&
      [...active].every((t) => clusterSet.has(t));
    if (isMatch) return cluster;
  }
  return null;
}
