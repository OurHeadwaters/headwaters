/**
 * E2E test: Gord context on episode detail pages (/library/:slug)
 *
 * Verifies that when a visitor navigates to /library/:slug and sends a message
 * to Gord, the outgoing POST /api/gord/chat request body carries:
 *   - context.description containing "Currently viewing" and the episode title
 *   - context.path equal to "/library/<slug>"
 *
 * A secondary check reads the hidden [data-testid="gord-context-description"]
 * element (rendered by GordGuide) for fast pre-send verification.
 */

import { test, expect } from "@playwright/test";

const KNOWN_SLUG = "tsprw-320";
const KNOWN_TITLE = "Gun and Hunting Wisdom of our Fathers \u2013 TSP Rewind";

const SECOND_SLUG = "tsprw-319";
const SECOND_TITLE = "Understanding Caliber, Millimeter, Gauges & Ballistics \u2013 TSP Rewind";

const EXPECTED_BASE_DESCRIPTION =
  "Episode detail page in the Library \u2014 full episode info, chapters, and related content";

test.describe("Gord context — episode detail page (/library/:slug)", () => {
  test("POST /api/gord/chat carries correct context.description and context.path", async ({ page }) => {
    // Intercept the chat request so we can inspect the body without making a real AI call
    let capturedBody: Record<string, unknown> | null = null;

    await page.route("**/api/gord/chat", async (route) => {
      const requestBody = route.request().postDataJSON() as Record<string, unknown>;
      capturedBody = requestBody;
      // Fulfil with a minimal SSE response so the UI doesn't hang
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body: 'data: {"done":true}\n\n',
      });
    });

    await page.goto(`/library/${KNOWN_SLUG}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });

    // Open Gord's chat
    await page.getByRole("button", { name: "Chat with Gord" }).click();

    // Type and send a message
    const input = page.getByPlaceholder("Ask Gord anything...");
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill("What is this episode about?");
    await input.press("Enter");

    // Wait for the route handler to capture the request
    await page.waitForTimeout(1500);

    expect(capturedBody).not.toBeNull();

    const context = (capturedBody as { context?: { description?: string; path?: string } }).context;
    expect(context).toBeDefined();
    expect(context!.path).toBe(`/library/${KNOWN_SLUG}`);
    expect(context!.description).toContain("Currently viewing");
    expect(context!.description).toContain(KNOWN_TITLE);
    expect(context!.description).toContain(EXPECTED_BASE_DESCRIPTION);
  });

  test("context.description is the exact expected string in the chat request", async ({ page }) => {
    let capturedBody: Record<string, unknown> | null = null;

    await page.route("**/api/gord/chat", async (route) => {
      capturedBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body: 'data: {"done":true}\n\n',
      });
    });

    await page.goto(`/library/${KNOWN_SLUG}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "Chat with Gord" }).click();
    const input = page.getByPlaceholder("Ask Gord anything...");
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill("Tell me more.");
    await input.press("Enter");

    await page.waitForTimeout(1500);

    const context = (capturedBody as { context?: { description?: string; path?: string } } | null)?.context;
    expect(context!.description).toBe(
      `${EXPECTED_BASE_DESCRIPTION} Currently viewing: "${KNOWN_TITLE}".`
    );
    expect(context!.path).toBe(`/library/${KNOWN_SLUG}`);
  });

  test("hidden gord-context-description element matches the chat request context", async ({ page }) => {
    await page.goto(`/library/${KNOWN_SLUG}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });

    const contextEl = page.locator('[data-testid="gord-context-description"]');
    await expect(contextEl).toBeAttached({ timeout: 5000 });

    const domText = (await contextEl.textContent()) ?? "";
    expect(domText).toContain("Currently viewing");
    expect(domText).toContain(KNOWN_TITLE);
    expect(domText).toContain(EXPECTED_BASE_DESCRIPTION);
  });

  test("context description updates when navigating to a different episode", async ({ page }) => {
    const capturedBodies: Array<{ path?: string; description?: string }> = [];

    await page.route("**/api/gord/chat", async (route) => {
      const body = route.request().postDataJSON() as { context?: { path?: string; description?: string } };
      capturedBodies.push(body.context ?? {});
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body: 'data: {"done":true}\n\n',
      });
    });

    // Send a message from the first episode
    await page.goto(`/library/${KNOWN_SLUG}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Chat with Gord" }).click();
    const input = page.getByPlaceholder("Ask Gord anything...");
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill("Hello.");
    await input.press("Enter");
    await page.waitForTimeout(1500);

    // Navigate to the second episode and send another message
    await page.goto(`/library/${SECOND_SLUG}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Chat with Gord" }).click();
    const input2 = page.getByPlaceholder("Ask Gord anything...");
    await expect(input2).toBeVisible({ timeout: 5000 });
    await input2.fill("What is this one about?");
    await input2.press("Enter");
    await page.waitForTimeout(1500);

    expect(capturedBodies).toHaveLength(2);

    expect(capturedBodies[0].path).toBe(`/library/${KNOWN_SLUG}`);
    expect(capturedBodies[0].description).toContain(KNOWN_TITLE);

    expect(capturedBodies[1].path).toBe(`/library/${SECOND_SLUG}`);
    expect(capturedBodies[1].description).toContain(SECOND_TITLE);
    expect(capturedBodies[1].description).not.toContain(KNOWN_TITLE);
  });
});
