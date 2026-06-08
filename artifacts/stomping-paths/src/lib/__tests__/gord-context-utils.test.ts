import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getTspPageDescription, buildGordContextDescription } from "../gord-context-utils.ts";

describe("getTspPageDescription", () => {
  it("returns the transform detail description for /transform/:slug paths", () => {
    const result = getTspPageDescription("/transform/conventional-to-regenerative");
    assert.equal(
      result,
      "Transformation detail page — episodes and resources for a specific personal transformation path"
    );
  });

  it("returns the transform listing description for /transform exactly", () => {
    const result = getTspPageDescription("/transform");
    assert.equal(
      result,
      "Transform page — guided transformation paths for real personal change (e.g. Food Freedom, Financial Independence, Skills & Community)"
    );
  });

  it("returns the track detail description for /tracks/:slug paths", () => {
    const result = getTspPageDescription("/tracks/food-independence");
    assert.equal(
      result,
      "Track detail page — individual learning track with a curated episode list and listener progress"
    );
  });

  it("returns the zone detail description for /zones/:slug paths", () => {
    const result = getTspPageDescription("/zones/zone-1");
    assert.equal(
      result,
      "Zone detail page — episodes and resources for a specific permaculture zone"
    );
  });

  it("returns a fallback for unknown paths", () => {
    const result = getTspPageDescription("/unknown-page");
    assert.equal(
      result,
      "The Stomping Path — a self-reliance and preparedness podcast community"
    );
  });
});

describe("getTspPageDescription — library detail page", () => {
  it("returns the episode detail description for /library/:slug paths", () => {
    const result = getTspPageDescription("/library/some-episode-slug");
    assert.equal(
      result,
      "Episode detail page in the Library — full episode info, chapters, and related content"
    );
  });

  it("returns the library listing description for /library exactly", () => {
    const result = getTspPageDescription("/library");
    assert.equal(
      result,
      "Library page — full episode archive with search and filter by source, zone, and transformation"
    );
  });
});

describe("buildGordContextDescription — library detail page", () => {
  it("includes 'Currently viewing' with the episode title when pageTitle is set", () => {
    const path = "/library/some-episode-slug";
    const pageTitle = "How to Build a Root Cellar";
    const result = buildGordContextDescription(path, pageTitle);

    assert.ok(
      result.includes("Currently viewing"),
      `Expected "Currently viewing" in context description, got: ${result}`
    );
    assert.ok(
      result.includes("How to Build a Root Cellar"),
      `Expected episode title in context description, got: ${result}`
    );
    assert.ok(
      result.includes("Episode detail page in the Library"),
      `Expected base page description in context, got: ${result}`
    );
  });

  it("does not include 'Currently viewing' when pageTitle is null", () => {
    const path = "/library/some-episode-slug";
    const result = buildGordContextDescription(path, null);

    assert.ok(
      !result.includes("Currently viewing"),
      `Expected no "Currently viewing" when pageTitle is null, got: ${result}`
    );
    assert.equal(
      result,
      "Episode detail page in the Library — full episode info, chapters, and related content"
    );
  });

  it("formats the full context description correctly", () => {
    const result = buildGordContextDescription(
      "/library/root-cellar-build",
      "How to Build a Root Cellar"
    );
    assert.equal(
      result,
      'Episode detail page in the Library — full episode info, chapters, and related content Currently viewing: "How to Build a Root Cellar".'
    );
  });
});

describe("buildGordContextDescription — zone detail page", () => {
  it("includes 'Currently viewing' with the zone name when pageTitle is set", () => {
    const path = "/zones/zone-1";
    const pageTitle = "Zone 1: Structures & Spaces";
    const result = buildGordContextDescription(path, pageTitle);

    assert.ok(
      result.includes("Currently viewing"),
      `Expected "Currently viewing" in context description, got: ${result}`
    );
    assert.ok(
      result.includes("Zone 1: Structures & Spaces"),
      `Expected zone name in context description, got: ${result}`
    );
    assert.ok(
      result.includes("Zone detail page"),
      `Expected base page description in context, got: ${result}`
    );
  });

  it("does not include 'Currently viewing' when pageTitle is null", () => {
    const path = "/zones/zone-0";
    const result = buildGordContextDescription(path, null);

    assert.ok(
      !result.includes("Currently viewing"),
      `Expected no "Currently viewing" when pageTitle is null, got: ${result}`
    );
    assert.equal(
      result,
      "Zone detail page — episodes and resources for a specific permaculture zone"
    );
  });

  it("formats the full context description correctly for a known slug", () => {
    const result = buildGordContextDescription(
      "/zones/zone-1",
      "Zone 1: Structures & Spaces"
    );
    assert.equal(
      result,
      'Zone detail page — episodes and resources for a specific permaculture zone Currently viewing: "Zone 1: Structures & Spaces".'
    );
  });

  it("works for other zone slugs", () => {
    const result = buildGordContextDescription(
      "/zones/zone-2",
      "Zone 2: Food & Growing"
    );
    assert.ok(result.includes('Currently viewing: "Zone 2: Food & Growing".'));
    assert.ok(result.includes("Zone detail page"));
  });
});

describe("buildGordContextDescription — transform detail page", () => {
  it("includes 'Currently viewing' with the transformation name when pageTitle is set", () => {
    const path = "/transform/conventional-to-regenerative";
    const pageTitle = "Conventional → Regenerative";
    const result = buildGordContextDescription(path, pageTitle);

    assert.ok(
      result.includes("Currently viewing"),
      `Expected "Currently viewing" in context description, got: ${result}`
    );
    assert.ok(
      result.includes("Conventional → Regenerative"),
      `Expected transformation name in context description, got: ${result}`
    );
    assert.ok(
      result.includes("Transformation detail page"),
      `Expected base page description in context, got: ${result}`
    );
  });

  it("does not include 'Currently viewing' when pageTitle is null", () => {
    const path = "/transform/conventional-to-regenerative";
    const result = buildGordContextDescription(path, null);

    assert.ok(
      !result.includes("Currently viewing"),
      `Expected no "Currently viewing" when pageTitle is null, got: ${result}`
    );
    assert.equal(
      result,
      "Transformation detail page — episodes and resources for a specific personal transformation path"
    );
  });

  it("formats the full context description correctly for a known slug", () => {
    const result = buildGordContextDescription(
      "/transform/conventional-to-regenerative",
      "Conventional → Regenerative"
    );
    assert.equal(
      result,
      'Transformation detail page — episodes and resources for a specific personal transformation path Currently viewing: "Conventional → Regenerative".'
    );
  });

  it("works for other transformation slugs", () => {
    const result = buildGordContextDescription(
      "/transform/employee-to-owner",
      "Employee → Owner"
    );
    assert.ok(result.includes('Currently viewing: "Employee → Owner".'));
    assert.ok(result.includes("Transformation detail page"));
  });
});
