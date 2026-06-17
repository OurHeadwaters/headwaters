/**
 * Canonical episode-count label shown across the site.
 * Update this single string when the archive milestone changes.
 */
export const TSP_EPISODE_COUNT = "6,000+";

/**
 * Year TSP first published. Used to derive show age dynamically.
 * Never hardcode a year-count — derive it from this constant instead.
 */
export const TSP_SHOW_START_YEAR = 2009;

/**
 * Current age of the show in whole years, computed at runtime.
 * Use this wherever the site says "X years of episodes" so the number
 * stays accurate without code changes.
 */
export const TSP_SHOW_AGE = new Date().getFullYear() - TSP_SHOW_START_YEAR;

/**
 * How long (in milliseconds) continuous loading must persist before the
 * "Fetching your progress…" hint fades in on the ContinueLearningWidget.
 *
 * Raise this value for a slower API baseline; lower it (or set it to 0) to
 * make the hint appear immediately. Useful for A/B experiments without a
 * code change to the component itself.
 */
export const EXTENDED_LOAD_THRESHOLD_MS = 1500;

/**
 * Minimum time (in milliseconds) the skeleton must remain visible before it
 * can be swapped out for real content.  Prevents a jarring flash when the API
 * responds very quickly.
 *
 * Lower this value to reduce perceived latency; raise it to make the skeleton
 * feel more deliberate.
 */
export const MIN_SKELETON_DISPLAY_MS = 300;
