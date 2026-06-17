import crypto from "crypto";
import { Resend } from "resend";
import { logger } from "./logger";
import { getSiteUrl } from "./config";

export interface HostConfirmationOptions {
  hostEmail: string;
  hostName: string;
  eventTitle: string;
  eventDate: string;
  dashboardUrl: string;
}

let resendClient: Resend | null = null;

/**
 * Returns the From address used for all kit-related emails.
 *
 * Set KIT_EMAIL_FROM in Replit Secrets to override (e.g. once you have
 * verified a different domain in Resend):
 *
 *   KIT_EMAIL_FROM="TSP Kits <kits@thestompingpaths.com>"
 *
 * Falls back to the thestompingpaths.com address which requires
 * that domain to be verified in Resend → https://resend.com/domains
 */
function getKitEmailFrom(): string {
  return process.env.KIT_EMAIL_FROM ?? "TSP Kits <kits@thestompingpaths.com>";
}

/**
 * Returns the reply-to address for kit emails.
 * Set KIT_EMAIL_REPLY_TO in Replit Secrets to override.
 */
function getKitEmailReplyTo(): string | undefined {
  return process.env.KIT_EMAIL_REPLY_TO;
}

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
  const siteUrl = getSiteUrl();
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
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a8c5a0;font-family:'Arial',sans-serif;">The Stomping Paths</p>
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
                Sent by The Stomping Paths Ground Events &mdash; <a href="${siteUrl}" style="color:#6b7c6b;text-decoration:none;">thestompingpaths.com</a>
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
  const siteUrl = getSiteUrl();
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
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a8c5a0;font-family:'Arial',sans-serif;">The Stomping Paths</p>
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
                Sent by The Stomping Paths Expert Council &mdash; <a href="${siteUrl}" style="color:#6b7c6b;text-decoration:none;">thestompingpaths.com</a>
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
  const siteUrl = getSiteUrl();
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
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a8c5a0;font-family:'Arial',sans-serif;">The Stomping Paths</p>
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
                Questions? Reply to this email or reach out at <a href="${siteUrl}" style="color:#2d4a2d;text-decoration:none;">thestompingpaths.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f0eb;padding:20px 40px;border-top:1px solid #e0d8d0;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;font-family:'Arial',sans-serif;">
                Sent by The Stomping Paths Ground Events &mdash; <a href="${siteUrl}" style="color:#6b7c6b;text-decoration:none;">thestompingpaths.com</a>
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
      from: "The Stomping Paths Expert Council <expert-council@thestompingpaths.com>",
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
      from: "The Stomping Paths Ground Events <ground-events@thestompingpaths.com>",
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

  const to = process.env.KIT_INQUIRY_EMAIL;
  if (!to) {
    logger.warn({ kitSlug: opts.kitSlug }, "email: KIT_INQUIRY_EMAIL not set — skipping kit inquiry notification");
    return;
  }

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
          <p style="margin:0;color:#888;font-size:12px;">Submitted via thestompingpaths.com/kits/${opts.kitSlug}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const { error } = await client.emails.send({
      from: getKitEmailFrom(),
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
  const siteUrl = getSiteUrl();
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
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a8c5a0;font-family:'Arial',sans-serif;">The Stomping Paths</p>
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
                <a href="${siteUrl}/kits/my-purchases?email=${encodeURIComponent(opts.buyerEmail)}"
                   style="color:#2d4a2d;text-decoration:none;font-family:'Arial',sans-serif;">
                  See all your kits →
                </a>
              </p>

              ${manualSection}

              <p style="margin:0;font-size:14px;color:#666666;line-height:1.6;">
                Questions? Visit <a href="${siteUrl}" style="color:#2d4a2d;text-decoration:none;">thestompingpaths.com</a> or reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f0eb;padding:20px 40px;border-top:1px solid #e0d8d0;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;font-family:'Arial',sans-serif;">
                Sent by The Stomping Paths Kits &mdash; <a href="${siteUrl}" style="color:#6b7c6b;text-decoration:none;">thestompingpaths.com</a>
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

export async function sendKitWelcomeEmail(opts: KitWelcomeEmailOptions): Promise<{ sent: boolean; error?: string }> {
  const client = getResendClient();
  if (!client) {
    logger.warn({ kitSlug: opts.kitSlug }, "email: RESEND_API_KEY not set — skipping kit welcome email");
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const displayName = opts.buyerName ?? opts.buyerEmail;

  try {
    const { error } = await client.emails.send({
      from: getKitEmailFrom(),
      to: [opts.buyerEmail],
      replyTo: getKitEmailReplyTo(),
      subject: `Welcome to your ${opts.kitName} — here's how to get started`,
      html: buildKitWelcomeHtml(opts),
    });

    if (error) {
      logger.error({ error, buyerEmail: opts.buyerEmail, kitSlug: opts.kitSlug }, "email: kit welcome email failed");
      return { sent: false, error: String(error) };
    }

    logger.info({ kitSlug: opts.kitSlug, buyerEmail: displayName }, "email: kit welcome email sent");
    return { sent: true };
  } catch (err) {
    logger.error({ err, kitSlug: opts.kitSlug }, "email: kit welcome email threw unexpectedly");
    return { sent: false, error: String(err) };
  }
}

export interface KitPurchaseAdminNotificationOptions {
  kitName: string;
  kitSlug: string;
  buyerEmail: string;
  buyerName: string | null;
  amountPaidCents: number;
  paymentMethod: "stripe" | "zaprite";
  welcomeEmailSent: boolean;
  welcomeEmailError?: string;
}

function buildKitPurchaseAdminHtml(opts: KitPurchaseAdminNotificationOptions): string {
  const siteUrl = getSiteUrl();
  const dollars = (opts.amountPaidCents / 100).toFixed(2);
  const displayName = opts.buyerName ?? opts.buyerEmail;
  const now = new Date().toLocaleString("en-CA", {
    timeZone: "America/Winnipeg",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const emailStatusColor = opts.welcomeEmailSent ? "#2d7a2d" : "#c0392b";
  const emailStatusLabel = opts.welcomeEmailSent ? "✓ Sent successfully" : "✗ Failed to send";
  const emailStatusNote = opts.welcomeEmailSent
    ? `The buyer's welcome email was delivered to <strong>${opts.buyerEmail}</strong>.`
    : `<strong>Action needed:</strong> The welcome email did not send${opts.welcomeEmailError ? ` — ${opts.welcomeEmailError}` : ""}. You may want to send a manual follow-up to <a href="mailto:${opts.buyerEmail}" style="color:#2d4a2d;">${opts.buyerEmail}</a>.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Kit Purchase: ${opts.kitName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1A2A20;padding:28px 40px;">
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a8c5a0;font-family:'Arial',sans-serif;">The Stomping Paths</p>
              <h1 style="margin:8px 0 0;font-size:22px;color:#D9A066;font-weight:normal;font-family:'Georgia',serif;">New Purchase: ${opts.kitName}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <!-- Purchase info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;border-left:4px solid #1A2A20;border-radius:4px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7c6b;font-family:'Arial',sans-serif;">Buyer</p>
                    <p style="margin:0 0 16px;font-size:17px;color:#1a2e1a;font-weight:bold;">${displayName}</p>

                    <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7c6b;font-family:'Arial',sans-serif;">Email</p>
                    <p style="margin:0 0 16px;font-size:15px;color:#1a2e1a;"><a href="mailto:${opts.buyerEmail}" style="color:#2d4a2d;text-decoration:none;">${opts.buyerEmail}</a></p>

                    <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7c6b;font-family:'Arial',sans-serif;">Amount Paid</p>
                    <p style="margin:0 0 16px;font-size:20px;color:#1a2e1a;font-weight:bold;">$${dollars} USD</p>

                    <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7c6b;font-family:'Arial',sans-serif;">Payment Method</p>
                    <p style="margin:0 0 16px;font-size:15px;color:#1a2e1a;">${opts.paymentMethod === "zaprite" ? "Bitcoin / Lightning / XRP (Zaprite)" : "Credit card (Stripe)"}</p>

                    <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7c6b;font-family:'Arial',sans-serif;">Timestamp</p>
                    <p style="margin:0;font-size:15px;color:#1a2e1a;">${now}</p>
                  </td>
                </tr>
              </table>

              <!-- Welcome email status -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${opts.welcomeEmailSent ? "#f0f7f0" : "#fff5f5"};border:1px solid ${opts.welcomeEmailSent ? "#c8dfc8" : "#f0c0c0"};border-radius:4px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#4a6b4a;font-family:'Arial',sans-serif;">Welcome Email Status</p>
                    <p style="margin:0 0 8px;font-size:16px;color:${emailStatusColor};font-weight:bold;font-family:'Arial',sans-serif;">${emailStatusLabel}</p>
                    <p style="margin:0;font-size:14px;color:#444444;line-height:1.6;">${emailStatusNote}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
                View all purchases: <a href="${siteUrl}/api/admin/kit-purchases?kitSlug=${opts.kitSlug}" style="color:#2d4a2d;">${siteUrl}/api/admin/kit-purchases?kitSlug=${opts.kitSlug}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f0eb;padding:20px 40px;border-top:1px solid #e0d8d0;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;font-family:'Arial',sans-serif;">
                Sent by The Stomping Paths Kits &mdash; <a href="${siteUrl}" style="color:#6b7c6b;text-decoration:none;">thestompingpaths.com</a>
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

export async function sendKitPurchaseAdminNotification(opts: KitPurchaseAdminNotificationOptions): Promise<void> {
  const client = getResendClient();
  if (!client) {
    logger.warn({ kitSlug: opts.kitSlug }, "email: RESEND_API_KEY not set — skipping purchase admin notification");
    return;
  }

  const to = process.env.KIT_INQUIRY_EMAIL;
  if (!to) {
    logger.warn({ kitSlug: opts.kitSlug }, "email: KIT_INQUIRY_EMAIL not set — skipping purchase admin notification");
    return;
  }

  const dollars = (opts.amountPaidCents / 100).toFixed(2);

  try {
    const { error } = await client.emails.send({
      from: getKitEmailFrom(),
      to: [to],
      replyTo: opts.buyerEmail,
      subject: `New purchase: ${opts.kitName} — $${dollars} — welcome email ${opts.welcomeEmailSent ? "✓ sent" : "✗ FAILED"}`,
      html: buildKitPurchaseAdminHtml(opts),
    });

    if (error) {
      logger.error({ error, kitSlug: opts.kitSlug }, "email: purchase admin notification failed");
    } else {
      logger.info({ kitSlug: opts.kitSlug, buyerEmail: opts.buyerEmail }, "email: purchase admin notification sent");
    }
  } catch (err) {
    logger.error({ err, kitSlug: opts.kitSlug }, "email: purchase admin notification threw unexpectedly");
  }
}

export interface GordTipNotificationOptions {
  tipperName: string | null;
  tipperEmail: string | null;
  amountCents: number;
}

function buildGordTipNotificationHtml(opts: GordTipNotificationOptions): string {
  const siteUrl = getSiteUrl();
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
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a8c5a0;font-family:'Arial',sans-serif;">The Stomping Paths</p>
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
                Sent by The Stomping Paths &mdash; <a href="${siteUrl}" style="color:#6b7c6b;text-decoration:none;">thestompingpaths.com</a>
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

  const to = process.env.GORD_TIP_EMAIL;
  if (!to) {
    logger.warn("email: GORD_TIP_EMAIL not set — skipping Gord tip notification");
    return;
  }
  const displayName = opts.tipperName ?? opts.tipperEmail ?? "Someone";
  const dollars = (opts.amountCents / 100).toFixed(2);

  try {
    const { error } = await client.emails.send({
      from: "The Stomping Paths <tips@thestompingpaths.com>",
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

export interface KitAccessEmailOptions {
  buyerEmail: string;
  kits: Array<{
    slug: string;
    name: string;
    tagline: string;
    token: string | null;
  }>;
}

function buildKitAccessEmailHtml(opts: KitAccessEmailOptions): string {
  const siteUrl = getSiteUrl();

  const kitRows = opts.kits
    .map((kit) => {
      const params = new URLSearchParams({ email: opts.buyerEmail });
      if (kit.token) params.set("token", kit.token);
      const accessUrl = `${siteUrl}/kits/${kit.slug}/welcome?${params.toString()}`;

      return `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;border-radius:6px;margin-bottom:16px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:17px;color:#1a2e1a;font-weight:bold;font-family:'Georgia',serif;">${kit.name}</p>
                    ${kit.tagline ? `<p style="margin:0 0 14px;font-size:14px;color:#666666;line-height:1.5;">${kit.tagline}</p>` : `<p style="margin:0 0 14px;"></p>`}
                    <a href="${accessUrl}"
                       style="display:inline-block;padding:10px 24px;background-color:#2d4a2d;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-family:'Arial',sans-serif;font-weight:bold;">
                      Open Kit →
                    </a>
                    <p style="margin:10px 0 0;font-size:11px;color:#aaaaaa;word-break:break-all;">
                      <a href="${accessUrl}" style="color:#8a9e88;">${accessUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your TSP Kit Access Links</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1A2A20;padding:28px 40px;">
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a8c5a0;font-family:'Arial',sans-serif;">The Stomping Paths</p>
              <h1 style="margin:8px 0 0;font-size:24px;color:#D9A066;font-weight:normal;font-family:'Georgia',serif;">Your kit access links</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#333333;line-height:1.6;">
                Here ${opts.kits.length === 1 ? "is the kit" : `are the ${opts.kits.length} kits`} purchased with <strong>${opts.buyerEmail}</strong>.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#666666;line-height:1.6;">
                Each link below opens your kit directly — no login required. Bookmark any page you'd like to revisit.
              </p>

              ${kitRows}

              <p style="margin:24px 0 0;font-size:14px;color:#666666;line-height:1.6;">
                Questions? Reply to this email or visit <a href="${siteUrl}" style="color:#2d4a2d;text-decoration:none;">thestompingpaths.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f0eb;padding:20px 40px;border-top:1px solid #e0d8d0;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;font-family:'Arial',sans-serif;">
                Sent by The Stomping Paths Kits &mdash; <a href="${siteUrl}" style="color:#6b7c6b;text-decoration:none;">thestompingpaths.com</a>
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

export async function sendKitAccessEmail(
  opts: KitAccessEmailOptions,
): Promise<{ sent: boolean; error?: string }> {
  const client = getResendClient();
  if (!client) {
    logger.warn({ buyerEmail: opts.buyerEmail }, "email: RESEND_API_KEY not set — skipping kit access email");
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const kitCount = opts.kits.length;
  const subject =
    kitCount === 1
      ? `Your access link for ${opts.kits[0].name}`
      : `Your ${kitCount} TSP kit access links`;

  try {
    const { error } = await client.emails.send({
      from: getKitEmailFrom(),
      to: [opts.buyerEmail],
      replyTo: getKitEmailReplyTo(),
      subject,
      html: buildKitAccessEmailHtml(opts),
    });

    if (error) {
      logger.error({ error, buyerEmail: opts.buyerEmail }, "email: kit access email failed");
      return { sent: false, error: String(error) };
    }

    logger.info({ buyerEmail: opts.buyerEmail, kitCount }, "email: kit access email sent");
    return { sent: true };
  } catch (err) {
    logger.error({ err, buyerEmail: opts.buyerEmail }, "email: kit access email threw unexpectedly");
    return { sent: false, error: String(err) };
  }
}

export interface KitExpiryReminderEmailOptions {
  buyerEmail: string;
  buyerName: string | null;
  kitName: string;
  kitSlug: string;
  accessUrl?: string;
}

function buildKitExpiryReminderHtml(opts: KitExpiryReminderEmailOptions): string {
  const displayName = opts.buyerName ?? "there";
  const siteUrl = getSiteUrl();
  const baseWelcomeUrl =
    opts.accessUrl ?? `${siteUrl}/kits/${opts.kitSlug}/welcome`;

  const token = generateKitAccessToken(opts.kitSlug, opts.buyerEmail);
  const welcomeUrl = token
    ? `${baseWelcomeUrl}?email=${encodeURIComponent(opts.buyerEmail)}&token=${token}`
    : baseWelcomeUrl;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your ${opts.kitName} access expires tomorrow</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1A2A20;padding:28px 40px;">
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a8c5a0;font-family:'Arial',sans-serif;">The Stomping Paths</p>
              <h1 style="margin:8px 0 0;font-size:24px;color:#D9A066;font-weight:normal;font-family:'Georgia',serif;">Your kit access expires tomorrow</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#333333;line-height:1.6;">
                Hi ${displayName},
              </p>
              <p style="margin:0 0 24px;font-size:16px;color:#333333;line-height:1.6;">
                Your access to the <strong>${opts.kitName}</strong> expires in about 24 hours
                because you haven't visited recently. Just open the kit to automatically
                extend your access for another 7 days — no action beyond visiting is needed.
              </p>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${welcomeUrl}"
                       style="display:inline-block;padding:14px 32px;background-color:#2d4a2d;color:#ffffff;text-decoration:none;border-radius:6px;font-size:16px;font-family:'Arial',sans-serif;font-weight:bold;">
                      Keep My Access →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#888888;line-height:1.5;text-align:center;">
                One click renews your 7-day session automatically.
              </p>
              <p style="margin:0 0 24px;font-size:12px;color:#aaaaaa;word-break:break-all;text-align:center;">
                <a href="${welcomeUrl}" style="color:#6b7c6b;">${welcomeUrl}</a>
              </p>

              <p style="margin:0;font-size:14px;color:#666666;line-height:1.6;">
                Questions? Visit <a href="${siteUrl}" style="color:#2d4a2d;text-decoration:none;">thestompingpaths.com</a> or reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f0eb;padding:20px 40px;border-top:1px solid #e0d8d0;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;font-family:'Arial',sans-serif;">
                Sent by The Stomping Paths Kits &mdash; <a href="${siteUrl}" style="color:#6b7c6b;text-decoration:none;">thestompingpaths.com</a>
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

export async function sendKitExpiryReminderEmail(
  opts: KitExpiryReminderEmailOptions,
): Promise<{ sent: boolean; error?: string }> {
  const client = getResendClient();
  if (!client) {
    logger.warn(
      { kitSlug: opts.kitSlug, buyerEmail: opts.buyerEmail },
      "email: RESEND_API_KEY not set — skipping kit expiry reminder",
    );
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { error } = await client.emails.send({
      from: getKitEmailFrom(),
      to: [opts.buyerEmail],
      replyTo: getKitEmailReplyTo(),
      subject: `Your ${opts.kitName} access expires tomorrow — one click to renew`,
      html: buildKitExpiryReminderHtml(opts),
    });

    if (error) {
      logger.error(
        { error, buyerEmail: opts.buyerEmail, kitSlug: opts.kitSlug },
        "email: kit expiry reminder failed",
      );
      return { sent: false, error: String(error) };
    }

    logger.info(
      { kitSlug: opts.kitSlug, buyerEmail: opts.buyerEmail },
      "email: kit expiry reminder sent",
    );
    return { sent: true };
  } catch (err) {
    logger.error(
      { err, kitSlug: opts.kitSlug, buyerEmail: opts.buyerEmail },
      "email: kit expiry reminder threw unexpectedly",
    );
    return { sent: false, error: String(err) };
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
      from: "The Stomping Paths Ground Events <ground-events@thestompingpaths.com>",
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
