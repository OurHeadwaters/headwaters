/**
 * E2E test: Gord context description on transformation detail pages
 *
 * Verifies that when a visitor navigates to /transform/:slug, the GordGuide
 * component receives the transformation name via useGordPageTitle and builds
 * a context description that includes 'Currently viewing: "<from> → <to>".'
 *
 * The context is exposed via a hidden [data-testid="gord-context-description"]
 * element so it can be asserted without triggering a live API call.
 */

import { test, expect } from "@playwright/test";

const KNOWN_SLUG = "conventional-to-regenerative";
const FROM = "Conventional";
const TO = "Regenerative";
const TRANSFORMATION_TITLE = `${FROM} → ${TO}`;

test.describe("Gord context description — transformation detail page", () => {
  test("shows 'Currently viewing: <transformation name>' in context", async ({ page }) => {
    await page.goto(`/transform/${KNOWN_SLUG}`);

    // Wait for the transformation to load (the page title renders once data arrives)
    await expect(
      page.locator("h1", { hasText: FROM }).first()
    ).toBeVisible({ timeout: 10000 });

    // The hidden [data-testid="gord-context-description"] element is rendered by
    // GordGuide and reflects the exact context.description that will be sent to
    // /api/gord/chat when the user sends a message.
    const contextEl = page.locator('[data-testid="gord-context-description"]');
    await expect(contextEl).toBeAttached({ timeout: 5000 });

    const contextText = await contextEl.textContent();

    expect(contextText).toContain("Currently viewing");
    expect(contextText).toContain(TRANSFORMATION_TITLE);
    expect(contextText).toContain("Transformation detail page");
  });

  test("context description includes the exact expected string", async ({ page }) => {
    await page.goto(`/transform/${KNOWN_SLUG}`);

    await expect(
      page.locator("h1", { hasText: FROM }).first()
    ).toBeVisible({ timeout: 10000 });

    const contextEl = page.locator('[data-testid="gord-context-description"]');
    await expect(contextEl).toBeAttached({ timeout: 5000 });

    const contextText = (await contextEl.textContent()) ?? "";

    expect(contextText).toBe(
      `Transformation detail page — episodes and resources for a specific personal transformation path Currently viewing: "${TRANSFORMATION_TITLE}".`
    );
  });

  test("context description updates when navigating to a different transformation", async ({ page }) => {
    await page.goto(`/transform/${KNOWN_SLUG}`);
    await expect(page.locator("h1", { hasText: FROM }).first()).toBeVisible({ timeout: 10000 });

    const contextEl = page.locator('[data-testid="gord-context-description"]');
    const firstContext = (await contextEl.textContent()) ?? "";
    expect(firstContext).toContain(TRANSFORMATION_TITLE);

    // Navigate to a different transformation
    await page.goto("/transform/employee-to-owner");
    await expect(page.locator("h1", { hasText: "Employee" }).first()).toBeVisible({ timeout: 10000 });

    const secondContext = (await contextEl.textContent()) ?? "";
    expect(secondContext).toContain('Currently viewing: "Employee → Owner".');
    expect(secondContext).not.toContain(TRANSFORMATION_TITLE);
  });
});
