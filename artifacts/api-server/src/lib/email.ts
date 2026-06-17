import crypto from "crypto";
import { Resend } from "resend";
import { logger } from "./logger";

export interface HostConfirmationOptions {
  hostEmail: string;
  hostName: string;
  eventTitle: string;
  eventDate: string;
  dashboardUrl: string;
}

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface RsvpNotificationOptions {
  hostEmail: string;
  hostName: string;
  eventTitle: string;
  eventDate: string;
  attendeeName: string | null;
  attendeeEmail: string;
}

function buildRsvpEmailHtml(opts: RsvpNotificationOptions): string {
  const displayName = opts.attendeeName ?? opts.attendeeEmail;
  const formattedDate = (() => {
    try {
      return new Date(opts.eventDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return opts.eventDate;
    }
  })();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New RSVP for ${opts.eventTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#2d4a2d;padding:28px 40px;">
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a8c5a0;font-family:'Arial',sans-serif;">The Survival Podcast</p>
              <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;font-weight:normal;font-family:'Georgia',serif;">New Workshop RSVP</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#333333;line-height:1.6;">
                Hi ${opts.hostName},
              </p>
              <p style="margin:0 0 24px;font-size:16px;color:#333333;line-height:1.6;">
                Someone just RSVP'd to your workshop. Here are the details:
              </p>

              <!-- Event info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;border-left:4px solid #2d4a2d;border-radius:4px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7c6b;font-family:'Arial',sans-serif;">Workshop</p>
                    <p style="margin:0 0 16px;font-size:17px;color:#1a2e1a;font-weight:bold;">${opts.eventTitle}</p>
                    <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7c6b;font-family:'Arial',sans-serif;">Date</p>
                    <p style="margin:0;font-size:15px;color:#1a2e1a;">${formattedDate}</p>
                  </td>
                </tr>
              </table>

              <!-- Attendee info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f7f0;border:1px solid #c8dfc8;border-radius:4px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#4a6b4a;font-family:'Arial',sans-serif;">Attendee</p>
                    ${opts.attendeeName ? `<p style="margin:0 0 4px;font-size:16px;color:#1a2e1a;font-weight:bold;">${opts.attendeeName}</p>` : ""}
                    <p style="margin:0;font-size:15px;color:#1a2e1a;"><a href="mailto:${opts.attendeeEmail}" style="color:#2d4a2d;text-decoration:none;">${opts.attendeeEmail}</a></p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#666666;line-height:1.6;">
                Reach out to ${displayName} directly to share any event details, location info, or next steps.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f0eb;padding:20px 40px;border-top:1px solid #e0d8d0;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;font-family:'Arial',sans-serif;">
                Sent by The Survival Podcast Ground Events &mdash; <a href="https://www.thesurvivalpodcast.com" style="color:#6b7c6b;text-decoration:none;">thesurvivalpodcast.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface ListingApprovalEmailOptions {
  applicantEmail: string;
  applicantName: string;
  expertSlug: string;
  checkoutUrl: string;
}

function buildListingApprovalHtml(opts: ListingApprovalEmailOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Expert Council Application is Approved</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#2d4a2d;padding:28px 40px;">
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a8c5a0;font-family:'Arial',sans-serif;">The Survival Podcast</p>
              <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;font-weight:normal;font-family:'Georgia',serif;">Expert Council Application Approved</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#333333;line-height:1.6;">
                Hi ${opts.applicantName},
              </p>
              <p style="margin:0 0 24px;font-size:16px;color:#333333;line-height:1.6;">
                Great news — your application for a featured listing on the Expert Council has been approved.
                Click the button below to complete your subscription ($149/month) and activate your listing.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${opts.checkoutUrl}"
                       style="display:inline-block;padding:14px 32px;background-color:#2d4a2d;color:#ffffff;text-decoration:none;border-radius:6px;font-size:16px;font-family:'Arial',sans-serif;font-weight:bold;">
                      Activate My Listing
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:14px;color:#666666;line-height:1.6;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:13px;color:#2d4a2d;word-break:break-all;">
                <a href="${opts.checkoutUrl}" style="color:#2d4a2d;">${opts.checkoutUrl}</a>
              </p>
              <p style="margin:0;font-size:14px;color:#666666;line-height:1.6;">
                Once your subscription is active, your listing will appear on the Expert Council directory
                and on zone resource pages matching your specialties.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f0eb;padding:20px 40px;border-top:1px solid #e0d8d0;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;font-family:'Arial',sans-serif;">
                Sent by The Survival Podcast Expert Council &mdash; <a href="https://www.thesurvivalpodcast.com" style="color:#6b7c6b;text-decoration:none;">thesurvivalpodcast.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildHostConfirmationEmailHtml(opts: HostConfirmationOptions): string {
  const formattedDate = (() => {
    try {
      return new Date(opts.eventDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return opts.eventDate;
    }
  })();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Workshop Is Live — ${opts.eventTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#2d4a2d;padding:28px 40px;">
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a8c5a0;font-family:'Arial',sans-serif;">The Survival Podcast</p>
              <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;font-weight:normal;font-family:'Georgia',serif;">Your Workshop Is Listed</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#333333;line-height:1.6;">
                Hi ${opts.hostName},
              </p>
              <p style="margin:0 0 24px;font-size:16px;color:#333333;line-height:1.6;">
                Your workshop has been successfully submitted to the TSP Ground Events board. Here's what you listed:
              </p>

              <!-- Event info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;border-left:4px solid #2d4a2d;border-radius:4px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7c6b;font-family:'Arial',sans-serif;">Workshop</p>
                    <p style="margin:0 0 16px;font-size:17px;color:#1a2e1a;font-weight:bold;">${opts.eventTitle}</p>
                    <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7c6b;font-family:'Arial',sans-serif;">Date</p>
                    <p style="margin:0;font-size:15px;color:#1a2e1a;">${formattedDate}</p>
                  </td>
                </tr>
              </table>

              <!-- Dashboard link -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f7f0;border:1px solid #c8dfc8;border-radius:4px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#4a6b4a;font-family:'Arial',sans-serif;">Your Private Dashboard</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#444444;line-height:1.5;">
                      Use this link to manage your event, view RSVPs, and update details. Keep it private — anyone with this link can manage your listing.
                    </p>
                    <a href="${opts.dashboardUrl}" style="display:inline-block;background-color:#2d4a2d;color:#ffffff;text-decoration:none;font-family:'Arial',sans-serif;font-size:14px;font-weight:bold;padding:12px 24px;border-radius:6px;">
                      Open My Dashboard →
                    </a>
                    <p style="margin:12px 0 0;font-size:11px;color:#888888;word-break:break-all;">
                      ${opts.dashboardUrl}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Surplus-share fee explainer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbf0;border:1px solid #e8dfc0;border-radius:4px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#8a6a20;font-family:'Arial',sans-serif;">Surplus-Share Fee Model</p>
                    <p style="margin:0;font-size:14px;color:#555555;line-height:1.6;">
                      For paid workshops, TSP charges a small platform fee only on tickets sold <em>above</em> your break-even number. You set the fee percentage (5%, 10%, or 15%) when you list the event. There is no charge on free events or on tickets up to your break-even count.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#666666;line-height:1.6;">
                Questions? Reply to this email or reach out at <a href="https://www.thesurvivalpodcast.com" style="color:#2d4a2d;text-decoration:none;">thesurvivalpodcast.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f0eb;padding:20px 40px;border-top:1px solid #e0d8d0;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;font-family:'Arial',sans-serif;">
                Sent by The Survival Podcast Ground Events &mdash; <a href="https://www.thesurvivalpodcast.com" style="color:#6b7c6b;text-decoration:none;">thesurvivalpodcast.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendListingApprovalEmail(
  opts: ListingApprovalEmailOptions,
): Promise<{ sent: boolean; error?: string }> {
  const client = getResendClient();
  if (!client) {
    logger.warn("RESEND_API_KEY not set — skipping listing approval email");
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { error } = await client.emails.send({
      from: "The Survival Podcast Expert Council <expert-council@thesurvivalpodcast.com>",
      to: [opts.applicantEmail],
      subject: "Your Expert Council listing is approved — activate now",
      html: buildListingApprovalHtml(opts),
    });

    if (error) {
      logger.error({ error, applicantEmail: opts.applicantEmail }, "email: listing approval send failed");
      return { sent: false, error: String(error) };
    }

    logger.info(
      { applicantEmail: opts.applicantEmail, expertSlug: opts.expertSlug },
      "email: listing approval sent",
    );
    return { sent: true };
  } catch (err) {
    logger.error({ err, applicantEmail: opts.applicantEmail }, "email: listing approval threw unexpectedly");
    return { sent: false, error: String(err) };
  }
}

export async function sendHostConfirmationEmail(opts: HostConfirmationOptions): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    logger.warn("RESEND_API_KEY not set — skipping host confirmation email");
    return false;
  }

  try {
    const { error } = await client.emails.send({
      from: "The Survival Podcast Ground Events <ground-events@thesurvivalpodcast.com>",
      to: [opts.hostEmail],
      subject: `Your workshop "${opts.eventTitle}" is listed — here's your dashboard link`,
      html: buildHostConfirmationEmailHtml(opts),
    });

    if (error) {
      logger.error({ error, hostEmail: opts.hostEmail }, "email: host confirmation failed");
      return false;
    }

    logger.info({ hostEmail: opts.hostEmail, eventTitle: opts.eventTitle }, "email: host confirmation sent");
    return true;
  } catch (err) {
    logger.error({ err, hostEmail: opts.hostEmail }, "email: host confirmation threw unexpectedly");
    return false;
  }
}

export interface KitInquiryNotificationOptions {
  kitName: string;
  kitSlug: string;
  name: string;
  email: string;
  notes: string;
}

export async function sendKitInquiryNotification(opts: KitInquiryNotificationOptions): Promise<void> {
  const client = getResendClient();
  if (!client) {
    logger.warn("RESEND_API_KEY not set — skipping kit inquiry notification email");
    return;
  }

  const to = process.env.KIT_INQUIRY_EMAIL ?? "jack@thesurvivalpodcast.com";

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><title>Kit Inquiry</title></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#1A2A20;padding:28px 32px;">
          <h1 style="margin:0;color:#D9A066;font-size:22px;">New Kit Inquiry: ${opts.kitName}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 12px;color:#333;font-size:15px;"><strong>Name:</strong> ${opts.name}</p>
          <p style="margin:0 0 12px;color:#333;font-size:15px;"><strong>Email:</strong> <a href="mailto:${opts.email}" style="color:#2d4a2d;">${opts.email}</a></p>
          <p style="margin:0 0 12px;color:#333;font-size:15px;"><strong>Kit:</strong> ${opts.kitName} (<code>${opts.kitSlug}</code>)</p>
          ${opts.notes ? `<p style="margin:16px 0 0;color:#333;font-size:15px;"><strong>Notes:</strong></p><p style="margin:8px 0 0;color:#555;font-size:14px;line-height:1.6;border-left:3px solid #D9A066;padding-left:12px;">${opts.notes}</p>` : ""}
          <hr style="border:none;border-top:1px solid #e8e2d8;margin:24px 0;" />
          <p style="margin:0;color:#888;font-size:12px;">Submitted via thesurvivalpodcast.com/kits/${opts.kitSlug}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const { error } = await client.emails.send({
      from: "TSP Kits <kits@thesurvivalpodcast.com>",
      to: [to],
      replyTo: opts.email,
      subject: `Kit Inquiry — ${opts.kitName} from ${opts.name}`,
      html,
    });
    if (error) {
      logger.error({ error, kitSlug: opts.kitSlug }, "email: kit inquiry notification failed");
    } else {
      logger.info({ kitSlug: opts.kitSlug, from: opts.email }, "email: kit inquiry notification sent");
    }
  } catch (err) {
    logger.error({ err, kitSlug: opts.kitSlug }, "email: kit inquiry notification threw unexpectedly");
  }
}

export interface KitWelcomeEmailOptions {
  buyerEmail: string;
  buyerName: string | null;
  kitName: string;
  kitSlug: string;
  userManual?: {
    what: string;
    first: string;
    next: string;
  };
  /** When set, the welcome email's primary button links here instead of the generic /kits/:slug/welcome page. */
  accessUrl?: string;
}

/**
 * Generates a short-lived HMAC token that proves a specific email address
 * purchased a specific kit.  The token is embedded in the welcome email link
 * so returning buyers are auto-verified on /kits/:slug/access without having
 * to type their email.
 *
 * Signing key: KIT_ACCESS_SECRET env var, falling back to RESEND_API_KEY.
 * If neither is set the function returns null and the plain URL is used.
 */
export function generateKitAccessToken(kitSlug: string, email: string): string | null {
  const secret = process.env.KIT_ACCESS_SECRET ?? process.env.RESEND_API_KEY;
  if (!secret) return null;
  return crypto
    .createHmac("sha256", secret)
    .update(`${kitSlug}:${email.toLowerCase()}`)
    .digest("hex");
}

/**
 * Verifies a kit access token produced by generateKitAccessToken.
 * Returns true only when the token is cryptographically valid.
 */
export function verifyKitAccessToken(
  kitSlug: string,
  email: string,
  token: string,
): boolean {
  const secret = process.env.KIT_ACCESS_SECRET ?? process.env.RESEND_API_KEY;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${kitSlug}:${email.toLowerCase()}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token.toLowerCase(), "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}

function buildKitWelcomeHtml(opts: KitWelcomeEmailOptions): string {
  const displayName = opts.buyerName ?? "there";
  const siteUrl = (process.env.SITE_URL ?? "https://www.thesurvivalpodcast.com").replace(/\/$/, "");
  const baseWelcomeUrl =
    opts.accessUrl ?? `${siteUrl}/kits/${opts.kitSlug}/welcome`;

  const token = generateKitAccessToken(opts.kitSlug, opts.buyerEmail);
  const welcomeUrl = token
    ? `${baseWelcomeUrl}?email=${encodeURIComponent(opts.buyerEmail)}&token=${token}`
    : baseWelcomeUrl;

  const manualSection = opts.userManual
    ? `
              <!-- User Manual -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;border-left:4px solid #D9A066;border-radius:4px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 16px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8a6a20;font-family:'Arial',sans-serif;">📖 Your User Manual</p>

                    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#1a2e1a;font-family:'Arial',sans-serif;">◆ What this kit is for</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#444444;line-height:1.6;padding-left:14px;">${opts.userManual.what}</p>

                    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#1a2e1a;font-family:'Arial',sans-serif;">→ What to do first</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#444444;line-height:1.6;padding-left:14px;">${opts.userManual.first}</p>

                    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#1a2e1a;font-family:'Arial',sans-serif;">→→ What to do next</p>
                    <p style="margin:0;font-size:14px;color:#444444;line-height:1.6;padding-left:14px;">${opts.userManual.next}</p>
                  </td>
                </tr>
              </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to your ${opts.kitName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1A2A20;padding:28px 40px;">
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a8c5a0;font-family:'Arial',sans-serif;">The Survival Podcast</p>
              <h1 style="margin:8px 0 0;font-size:24px;color:#D9A066;font-weight:normal;font-family:'Georgia',serif;">Welcome to your ${opts.kitName}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#333333;line-height:1.6;">
                Hi ${displayName},
              </p>
              <p style="margin:0 0 24px;font-size:16px;color:#333333;line-height:1.6;">
                Your purchase is confirmed. Your kit is ready — here's everything you need to get started.
              </p>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${welcomeUrl}"
                       style="display:inline-block;padding:14px 32px;background-color:#2d4a2d;color:#ffffff;text-decoration:none;border-radius:6px;font-size:16px;font-family:'Arial',sans-serif;font-weight:bold;">
                      Open Your Kit →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#888888;line-height:1.5;text-align:center;">
                Bookmark this page — it's your persistent starting point for the ${opts.kitName}.
              </p>
              <p style="margin:0 0 20px;font-size:12px;color:#aaaaaa;word-break:break-all;text-align:center;">
                <a href="${welcomeUrl}" style="color:#6b7c6b;">${welcomeUrl}</a>
              </p>

              <!-- Secondary CTA: My Kits library -->
              <p style="margin:0 0 28px;font-size:14px;text-align:center;">
                <a href="https://www.thesurvivalpodcast.com/kits/my-purchases"
                   style="color:#2d4a2d;text-decoration:none;font-family:'Arial',sans-serif;">
                  See all your kits →
                </a>
              </p>

              ${manualSection}

              <p style="margin:0;font-size:14px;color:#666666;line-height:1.6;">
                Questions? Visit <a href="https://www.thesurvivalpodcast.com" style="color:#2d4a2d;text-decoration:none;">thesurvivalpodcast.com</a> or reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f0eb;padding:20px 40px;border-top:1px solid #e0d8d0;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;font-family:'Arial',sans-serif;">
                Sent by The Survival Podcast Kits &mdash; <a href="https://www.thesurvivalpodcast.com" style="color:#6b7c6b;text-decoration:none;">thesurvivalpodcast.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendKitWelcomeEmail(opts: KitWelcomeEmailOptions): Promise<void> {
  const client = getResendClient();
  if (!client) {
    logger.warn({ kitSlug: opts.kitSlug }, "email: RESEND_API_KEY not set — skipping kit welcome email");
    return;
  }

  const displayName = opts.buyerName ?? opts.buyerEmail;

  try {
    const { error } = await client.emails.send({
      from: "TSP Kits <kits@thesurvivalpodcast.com>",
      to: [opts.buyerEmail],
      subject: `Welcome to your ${opts.kitName} — here's how to get started`,
      html: buildKitWelcomeHtml(opts),
    });

    if (error) {
      logger.error({ error, buyerEmail: opts.buyerEmail, kitSlug: opts.kitSlug }, "email: kit welcome email failed");
    } else {
      logger.info({ kitSlug: opts.kitSlug, buyerEmail: displayName }, "email: kit welcome email sent");
    }
  } catch (err) {
    logger.error({ err, kitSlug: opts.kitSlug }, "email: kit welcome email threw unexpectedly");
  }
}

export interface GordTipNotificationOptions {
  tipperName: string | null;
  tipperEmail: string | null;
  amountCents: number;
}

function buildGordTipNotificationHtml(opts: GordTipNotificationOptions): string {
  const displayName = opts.tipperName ?? opts.tipperEmail ?? "Someone";
  const dollars = (opts.amountCents / 100).toFixed(2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Tip from ${displayName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#2d4a2d;padding:28px 40px;">
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a8c5a0;font-family:'Arial',sans-serif;">The Survival Podcast</p>
              <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;font-weight:normal;font-family:'Georgia',serif;">Someone just sent you a tip 🎉</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 24px;font-size:16px;color:#333333;line-height:1.6;">
                Hi Gord — a listener just tipped you. Here are the details:
              </p>

              <!-- Tip info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;border-left:4px solid #2d4a2d;border-radius:4px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7c6b;font-family:'Arial',sans-serif;">From</p>
                    <p style="margin:0 0 16px;font-size:17px;color:#1a2e1a;font-weight:bold;">${displayName}</p>
                    ${opts.tipperEmail ? `<p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7c6b;font-family:'Arial',sans-serif;">Email</p>
                    <p style="margin:0 0 16px;font-size:15px;color:#1a2e1a;"><a href="mailto:${opts.tipperEmail}" style="color:#2d4a2d;text-decoration:none;">${opts.tipperEmail}</a></p>` : ""}
                    <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7c6b;font-family:'Arial',sans-serif;">Amount</p>
                    <p style="margin:0;font-size:22px;color:#1a2e1a;font-weight:bold;">$${dollars}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:15px;color:#444444;line-height:1.6;">
                Consider sending ${opts.tipperName ?? "them"} a quick thank-you${opts.tipperEmail ? ` at <a href="mailto:${opts.tipperEmail}" style="color:#2d4a2d;text-decoration:none;">${opts.tipperEmail}</a>` : ""} — a personal note goes a long way.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f0eb;padding:20px 40px;border-top:1px solid #e0d8d0;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;font-family:'Arial',sans-serif;">
                Sent by The Survival Podcast &mdash; <a href="https://www.thesurvivalpodcast.com" style="color:#6b7c6b;text-decoration:none;">thesurvivalpodcast.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendGordTipNotificationEmail(opts: GordTipNotificationOptions): Promise<void> {
  const client = getResendClient();
  if (!client) {
    logger.warn("RESEND_API_KEY not set — skipping Gord tip notification email");
    return;
  }

  const to = process.env.GORD_TIP_EMAIL ?? "jack@thesurvivalpodcast.com";
  const displayName = opts.tipperName ?? opts.tipperEmail ?? "Someone";
  const dollars = (opts.amountCents / 100).toFixed(2);

  try {
    const { error } = await client.emails.send({
      from: "The Survival Podcast <tips@thesurvivalpodcast.com>",
      to: [to],
      subject: `New tip from ${displayName} — $${dollars}`,
      html: buildGordTipNotificationHtml(opts),
    });

    if (error) {
      logger.error({ error, to }, "email: Gord tip notification failed");
    } else {
      logger.info({ to, amountCents: opts.amountCents, tipperEmail: opts.tipperEmail }, "email: Gord tip notification sent");
    }
  } catch (err) {
    logger.error({ err }, "email: Gord tip notification threw unexpectedly");
  }
}

export async function sendRsvpNotification(opts: RsvpNotificationOptions): Promise<void> {
  const client = getResendClient();
  if (!client) {
    logger.warn("RESEND_API_KEY not set — skipping RSVP host notification email");
    return;
  }

  const displayName = opts.attendeeName ?? opts.attendeeEmail;

  try {
    const { error } = await client.emails.send({
      from: "The Survival Podcast Ground Events <ground-events@thesurvivalpodcast.com>",
      to: [opts.hostEmail],
      subject: `New RSVP: ${displayName} signed up for "${opts.eventTitle}"`,
      html: buildRsvpEmailHtml(opts),
    });

    if (error) {
      logger.error({ error, hostEmail: opts.hostEmail }, "email: RSVP notification failed");
    } else {
      logger.info({ hostEmail: opts.hostEmail, attendeeEmail: opts.attendeeEmail }, "email: RSVP notification sent");
    }
  } catch (err) {
    logger.error({ err, hostEmail: opts.hostEmail }, "email: RSVP notification threw unexpectedly");
  }
}
