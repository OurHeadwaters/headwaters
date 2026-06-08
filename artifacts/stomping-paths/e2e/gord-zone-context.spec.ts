/**
 * E2E test: Gord context description on zone detail pages
 *
 * Verifies that when a visitor navigates to /zones/:slug, the GordGuide
 * component receives the zone name via useGordPageTitle and builds a context
 * description that includes 'Currently viewing: "Zone N: <name>".'
 *
 * Two verification paths:
 *  1. Hidden [data-testid="gord-context-description"] DOM element — reflects
 *     the exact context.description that will be sent to /api/gord/chat.
 *  2. Intercepted POST /api/gord/chat request body — asserts context.path and
 *     context.description in the actual outgoing network payload.
 */

import { test, expect } from "@playwright/test";

const KNOWN_SLUG = "zone-0";
const ZONE_NAME = "The Self";
const ZONE_TITLE = `Zone 0: ${ZONE_NAME}`;
const EXPECTED_BASE = "Zone detail page — episodes and resources for a specific permaculture zone";
const EXPECTED_CONTEXT = `${EXPECTED_BASE} Currently viewing: "${ZONE_TITLE}".`;

test.describe("Gord context description — zone detail page", () => {
  test("shows 'Currently viewing: <zone name>' in context", async ({ page }) => {
    await page.goto(`/zones/${KNOWN_SLUG}`);

    await expect(
      page.locator("h1", { hasText: ZONE_NAME }).first()
    ).toBeVisible({ timeout: 10000 });

    const contextEl = page.locator('[data-testid="gord-context-description"]');
    await expect(contextEl).toBeAttached({ timeout: 5000 });

    const contextText = await contextEl.textContent();

    expect(contextText).toContain("Currently viewing");
    expect(contextText).toContain(ZONE_TITLE);
    expect(contextText).toContain("Zone detail page");
  });

  test("context description includes the exact expected string", async ({ page }) => {
    await page.goto(`/zones/${KNOWN_SLUG}`);

    await expect(
      page.locator("h1", { hasText: ZONE_NAME }).first()
    ).toBeVisible({ timeout: 10000 });

    const contextEl = page.locator('[data-testid="gord-context-description"]');
    await expect(contextEl).toBeAttached({ timeout: 5000 });

    const contextText = (await contextEl.textContent()) ?? "";
    expect(contextText).toBe(EXPECTED_CONTEXT);
  });

  test("POST /api/gord/chat body contains correct context.path and context.description", async ({ page }) => {
    let capturedBody: { context?: { path?: string; description?: string } } | null = null;

    await page.route("**/api/gord/chat", async (route) => {
      const request = route.request();
      try {
        capturedBody = JSON.parse(request.postData() ?? "{}");
      } catch {
        capturedBody = null;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply: "Zone context confirmed.",
          suggestedFollowUps: [],
        }),
      });
    });

    await page.goto(`/zones/${KNOWN_SLUG}`);

    await expect(
      page.locator("h1", { hasText: ZONE_NAME }).first()
    ).toBeVisible({ timeout: 10000 });

    await page.locator('[aria-label="Chat with Gord"]').click();

    const chatInput = page.locator('textarea[placeholder="Ask Gord anything..."]');
    await chatInput.waitFor({ state: "visible", timeout: 5000 });
    await chatInput.fill("What zone is this?");
    await page.keyboard.press("Enter");

    await page.waitForTimeout(2000);

    expect(capturedBody).not.toBeNull();
    expect(capturedBody?.context?.path).toBe(`/zones/${KNOWN_SLUG}`);
    expect(capturedBody?.context?.description).toContain("Currently viewing");
    expect(capturedBody?.context?.description).toContain(ZONE_TITLE);
  });
});
