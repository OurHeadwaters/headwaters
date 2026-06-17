/**
 * Unit tests for buildKitWelcomeHtml.
 *
 * These tests exercise the HTML rendering path directly so that regressions
 * in the welcome email template — broken access URL, missing kit name, missing
 * buyer name, malformed link structure — surface before they reach a buyer's
 * inbox.  No network calls are made; Resend is not involved.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildKitWelcomeHtml, type KitWelcomeEmailOptions } from "./email.js";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function baseOpts(overrides: Partial<KitWelcomeEmailOptions> = {}): KitWelcomeEmailOptions {
  return {
    buyerEmail: "buyer@example.com",
    buyerName: "Alice",
    kitName: "Family Kit",
    kitSlug: "family-kit",
    ...overrides,
  };
}

/* ─── Tests ──────────────────────────────────────────────────────────────── */

describe("buildKitWelcomeHtml", () => {
  describe("buyer name", () => {
    it("includes the buyer name when provided", () => {
      const html = buildKitWelcomeHtml(baseOpts({ buyerName: "Alice" }));
      expect(html).toContain("Hi Alice");
    });

    it("falls back to 'there' when buyerName is null", () => {
      const html = buildKitWelcomeHtml(baseOpts({ buyerName: null }));
      expect(html).toContain("Hi there");
      expect(html).not.toContain("Hi null");
    });
  });

  describe("kit name", () => {
    it("includes the kit name in the title element", () => {
      const html = buildKitWelcomeHtml(baseOpts({ kitName: "Family Kit" }));
      expect(html).toContain("Welcome to your Family Kit");
    });

    it("includes the kit name in the h1 heading", () => {
      const html = buildKitWelcomeHtml(baseOpts({ kitName: "Budget Kit" }));
      const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
      expect(h1Match).not.toBeNull();
      expect(h1Match![1]).toContain("Budget Kit");
    });

    it("uses the correct kit name throughout for a different kit", () => {
      const html = buildKitWelcomeHtml(baseOpts({ kitName: "Digital Kit", kitSlug: "digital-kit" }));
      expect(html).toContain("Digital Kit");
    });
  });

  describe("access URL — internal (no accessUrl)", () => {
    it("contains the TSP welcome page URL when no external accessUrl is given", () => {
      const html = buildKitWelcomeHtml(baseOpts());
      expect(html).toContain("/kits/family-kit/welcome");
    });

    it("embeds the buyer email in the TSP welcome URL href", () => {
      // Force a non-null token so the welcome URL is built with the email param.
      // Without a secret the URL is bare (/kits/:slug/welcome) — no email appended.
      const prev = process.env.KIT_ACCESS_SECRET;
      process.env.KIT_ACCESS_SECRET = "test-secret-for-email-test";
      try {
        const html = buildKitWelcomeHtml(baseOpts({ buyerEmail: "buyer@example.com" }));
        const encodedEmail = encodeURIComponent("buyer@example.com");
        // The welcome page href must carry the email param — not just somewhere else in the doc
        expect(html).toMatch(
          new RegExp(`href="[^"]*kits/family-kit/welcome[^"]*${encodedEmail}[^"]*"`),
        );
      } finally {
        if (prev === undefined) {
          delete process.env.KIT_ACCESS_SECRET;
        } else {
          process.env.KIT_ACCESS_SECRET = prev;
        }
      }
    });

    it("shows 'Open Your Kit' CTA label for internal kits", () => {
      const html = buildKitWelcomeHtml(baseOpts());
      expect(html).toContain("Open Your Kit");
    });
  });

  describe("access URL — external (accessUrl provided)", () => {
    const externalUrl = "https://course.example.com/parrs-jars/access";

    it("uses the external accessUrl as the primary button href", () => {
      const html = buildKitWelcomeHtml(
        baseOpts({ kitSlug: "parrs-jars", kitName: "Parr's Jars", accessUrl: externalUrl }),
      );
      expect(html).toContain(`href="${externalUrl}"`);
    });

    it("shows 'Access Your Content' CTA label for external kits", () => {
      const html = buildKitWelcomeHtml(
        baseOpts({ kitSlug: "parrs-jars", kitName: "Parr's Jars", accessUrl: externalUrl }),
      );
      expect(html).toContain("Access Your Content");
    });

    it("also includes the TSP welcome page as a re-access route", () => {
      const html = buildKitWelcomeHtml(
        baseOpts({ kitSlug: "parrs-jars", kitName: "Parr's Jars", accessUrl: externalUrl }),
      );
      expect(html).toContain("/kits/parrs-jars/welcome");
    });

    it("does not append TSP token params to the external access URL", () => {
      const html = buildKitWelcomeHtml(
        baseOpts({ kitSlug: "parrs-jars", kitName: "Parr's Jars", accessUrl: externalUrl }),
      );
      const externalHref = `href="${externalUrl}"`;
      expect(html).toContain(externalHref);
      const externalHrefWithToken = `href="${externalUrl}?`;
      expect(html).not.toContain(externalHrefWithToken);
    });
  });

  describe("user manual section", () => {
    const manual = {
      what: "Build your 30-day food baseline.",
      first: "Start the Prepared at Home track.",
      next: "Move to the 90-day pantry after the core episodes.",
    };

    it("includes all three manual sections when userManual is provided", () => {
      const html = buildKitWelcomeHtml(baseOpts({ userManual: manual }));
      expect(html).toContain(manual.what);
      expect(html).toContain(manual.first);
      expect(html).toContain(manual.next);
    });

    it("omits the user manual section when not provided", () => {
      const html = buildKitWelcomeHtml(baseOpts({ userManual: undefined }));
      expect(html).not.toContain("Your User Manual");
      expect(html).not.toContain("What to do first");
    });
  });

  describe("HTML structure", () => {
    it("produces a complete HTML document", () => {
      const html = buildKitWelcomeHtml(baseOpts());
      expect(html).toMatch(/^<!DOCTYPE html>/);
      expect(html).toContain("</html>");
    });

    it("includes the my-purchases link with the buyer email", () => {
      const html = buildKitWelcomeHtml(baseOpts({ buyerEmail: "buyer@example.com" }));
      expect(html).toContain("/kits/my-purchases?email=");
      expect(html).toContain(encodeURIComponent("buyer@example.com"));
    });
  });
});
