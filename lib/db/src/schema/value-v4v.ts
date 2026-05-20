import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * Registered V4V creators — hosts, guests, clippers, remixers who receive
 * a share of listener tips/boosts. Each creator has exactly one wallet.
 */
export const creatorsTable = pgTable(
  "creators",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    role: text("role").notNull().default("host"), // host | guest | clipper | remixer
    walletType: text("wallet_type").notNull(), // lightning | xrpl
    walletAddress: text("wallet_address").notNull(), // Lightning address (user@domain) or XRPL r-address
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("creators_wallet_type_idx").on(t.walletType),
    index("creators_name_idx").on(t.name),
  ],
);

export type Creator = typeof creatorsTable.$inferSelect;
export type InsertCreator = typeof creatorsTable.$inferInsert;

/**
 * Per-episode value splits. Ties a creator to a specific episode with a
 * percentage weight. Weights for a given episode slug should sum to 100.
 * If no splits exist for an episode, the default_value_splits are used.
 */
export const episodeValueSplitsTable = pgTable(
  "episode_value_splits",
  {
    id: serial("id").primaryKey(),
    episodeSlug: text("episode_slug").notNull(),
    creatorId: integer("creator_id")
      .notNull()
      .references(() => creatorsTable.id, { onDelete: "cascade" }),
    splitPct: real("split_pct").notNull(), // 0.0 – 100.0
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("episode_value_splits_slug_idx").on(t.episodeSlug),
    uniqueIndex("episode_value_splits_slug_creator_idx").on(
      t.episodeSlug,
      t.creatorId,
    ),
  ],
);

export type EpisodeValueSplit = typeof episodeValueSplitsTable.$inferSelect;
export type InsertEpisodeValueSplit =
  typeof episodeValueSplitsTable.$inferInsert;

/**
 * Global default splits used when no episode-specific split table exists.
 * Seeded with Jack Spirko (host) at 100%.
 */
export const defaultValueSplitsTable = pgTable(
  "default_value_splits",
  {
    id: serial("id").primaryKey(),
    creatorId: integer("creator_id")
      .notNull()
      .references(() => creatorsTable.id, { onDelete: "cascade" }),
    splitPct: real("split_pct").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("default_value_splits_creator_idx").on(t.creatorId),
  ],
);

export type DefaultValueSplit = typeof defaultValueSplitsTable.$inferSelect;
export type InsertDefaultValueSplit =
  typeof defaultValueSplitsTable.$inferInsert;
