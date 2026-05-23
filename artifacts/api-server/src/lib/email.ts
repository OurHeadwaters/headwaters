import { Resend } from "resend";
import { logger } from "./logger";

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
