import nodemailer from 'nodemailer';
import { BookingRecord, ProfileRecord, ServiceRecord } from '../config/supabase';

// Safe transporter setup
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development fallback: stream / json transport with console logging
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    }
  }
  return transporter;
}

const FROM_HEADER = `"MOSAIC STUDIO" <${process.env.SMTP_FROM || 'concierge@mosaic.studio'}>`;

function baseHtmlTemplate(title: string, preheader: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #080808; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F7F5F0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #101010; border: 1px solid #222222; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { padding: 32px 32px 24px; border-bottom: 1px solid #1C1C1C; text-align: center; background-color: #0D0D0D; }
    .logo { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; letter-spacing: 0.2em; font-weight: 700; color: #F7F5F0; text-decoration: none; display: inline-block; }
    .sublogo { font-size: 9px; font-family: monospace; letter-spacing: 0.3em; color: #C9A86A; text-transform: uppercase; margin-top: 4px; display: block; }
    .content { padding: 36px 32px; }
    .badge { display: inline-block; padding: 4px 10px; background-color: #1A1A1A; border: 1px solid #333333; color: #C9A86A; font-family: monospace; font-size: 11px; letter-spacing: 0.1em; border-radius: 2px; text-transform: uppercase; margin-bottom: 16px; }
    .title { font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #F7F5F0; margin: 0 0 16px; font-weight: 300; line-height: 1.3; }
    .text { font-size: 14px; line-height: 1.6; color: #BBBBBB; margin: 0 0 24px; }
    .card { background-color: #141414; border: 1px solid #242424; border-radius: 3px; padding: 20px; margin: 24px 0; }
    .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1C1C1C; font-size: 13px; }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #888888; font-family: monospace; text-transform: uppercase; font-size: 11px; }
    .card-value { color: #F7F5F0; font-weight: 500; text-align: right; }
    .highlight-gold { color: #C9A86A; font-weight: 600; }
    .btn { display: inline-block; background-color: #C9A86A; color: #080808; text-decoration: none; padding: 14px 28px; font-family: monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 2px; text-align: center; }
    .footer { padding: 24px 32px; background-color: #0A0A0A; border-top: 1px solid #1C1C1C; text-align: center; font-size: 11px; color: #666666; font-family: monospace; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#080808;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="container">
    <div class="header">
      <div class="logo">MOSAIC</div>
      <div class="sublogo">High-End Photography Platform</div>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin:0 0 8px;">MOSAIC STUDIO PLATFORM — RESERVATIONS & COMMISSIONS</p>
      <p style="margin:0;">Ref: Auto-Generated Notification. No reply to this automated dispatch.</p>
    </div>
  </div>
</body>
</html>
`;
}

export const emailService = {
  /**
   * Dispatches new booking notification to the photographer
   */
  async sendNewBookingToPhotographer(
    booking: BookingRecord,
    photographer: ProfileRecord,
    service?: ServiceRecord | null
  ) {
    try {
      const trans = getTransporter();
      const title = `New Booking Request: ${booking.booking_reference}`;
      const preheader = `New session reservation from ${booking.customer_name} on ${booking.booking_date}`;

      const content = `
        <span class="badge">Action Required • New Reservation</span>
        <h1 class="title">New Session Booking Request</h1>
        <p class="text">
          Hello <strong>${photographer.name}</strong>,<br>
          A client has placed a new photography session reservation via your public MOSAIC studio. Please review the commission details below and respond via your Studio Dashboard.
        </p>

        <div class="card">
          <div class="card-row">
            <span class="card-label">Booking Reference</span>
            <span class="card-value highlight-gold">${booking.booking_reference}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Client Name</span>
            <span class="card-value">${booking.customer_name}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Client Email</span>
            <span class="card-value">${booking.customer_email}</span>
          </div>
          ${booking.customer_phone ? `
          <div class="card-row">
            <span class="card-label">Client Phone</span>
            <span class="card-value">${booking.customer_phone}</span>
          </div>` : ''}
          <div class="card-row">
            <span class="card-label">Service Package</span>
            <span class="card-value">${booking.service_name || service?.name || 'Commission Package'}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Date & Time</span>
            <span class="card-value">${booking.booking_date} • ${booking.start_time} - ${booking.end_time}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Session Value</span>
            <span class="card-value highlight-gold">${booking.currency || service?.currency || 'EUR'} ${Number(booking.price).toLocaleString()}</span>
          </div>
          ${booking.location ? `
          <div class="card-row">
            <span class="card-label">Shoot Location</span>
            <span class="card-value">${booking.location}</span>
          </div>` : ''}
          ${booking.message ? `
          <div class="card-row" style="flex-direction:column; gap:6px;">
            <span class="card-label">Client Creative Note</span>
            <span class="card-value" style="text-align:left; font-style:italic; font-size:12px; color:#AAAAAA;">"${booking.message}"</span>
          </div>` : ''}
        </div>

        <div style="text-align: center; margin-top: 32px;">
          <p class="text" style="margin-bottom:16px;">Log in to your studio dashboard to confirm or manage this reservation.</p>
        </div>
      `;

      const html = baseHtmlTemplate(title, preheader, content);
      const text = `NEW BOOKING REQUEST (${booking.booking_reference})\n\nClient: ${booking.customer_name} (${booking.customer_email})\nService: ${booking.service_name || service?.name}\nDate: ${booking.booking_date} from ${booking.start_time} to ${booking.end_time}\nValue: ${booking.currency || 'EUR'} ${booking.price}\n\nLog in to your MOSAIC dashboard to review.`;

      const info = await trans.sendMail({
        from: FROM_HEADER,
        to: photographer.email,
        subject: `[MOSAIC] New Booking Request — ${booking.customer_name} (${booking.booking_reference})`,
        text,
        html,
      });

      console.log(`[Email] New booking notice sent to photographer (${photographer.email}): ${info.messageId || 'local-stream'}`);
      return info;
    } catch (err: any) {
      console.warn(`[Email] Could not dispatch email to photographer: ${err.message}`);
    }
  },

  /**
   * Dispatches booking confirmation to the customer
   */
  async sendBookingConfirmedToCustomer(
    booking: BookingRecord,
    photographer: ProfileRecord,
    service?: ServiceRecord | null
  ) {
    try {
      const trans = getTransporter();
      const title = `Booking Confirmed: ${booking.booking_reference}`;
      const preheader = `Your photography session with ${photographer.name} is confirmed for ${booking.booking_date}`;

      const content = `
        <span class="badge" style="background-color:#14291B; border-color:#265A34; color:#52D68A;">Confirmed • Session Reserved</span>
        <h1 class="title">Your Photography Session is Confirmed</h1>
        <p class="text">
          Dear <strong>${booking.customer_name}</strong>,<br>
          We are pleased to inform you that <strong>${photographer.name}</strong> has reviewed and confirmed your upcoming photography session reservation.
        </p>

        <div class="card">
          <div class="card-row">
            <span class="card-label">Booking Reference</span>
            <span class="card-value highlight-gold">${booking.booking_reference}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Photographer</span>
            <span class="card-value">${photographer.name}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Package</span>
            <span class="card-value">${booking.service_name || service?.name || 'Photography Commission'}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Scheduled Date</span>
            <span class="card-value">${booking.booking_date}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Session Time</span>
            <span class="card-value">${booking.start_time} - ${booking.end_time}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Total Investment</span>
            <span class="card-value highlight-gold">${booking.currency || service?.currency || 'EUR'} ${Number(booking.price).toLocaleString()}</span>
          </div>
          ${booking.location ? `
          <div class="card-row">
            <span class="card-label">Location</span>
            <span class="card-value">${booking.location}</span>
          </div>` : ''}
        </div>

        <p class="text">
          If you have any questions or creative mood boards to share prior to your session, you can reach out directly to the studio at <a href="mailto:${photographer.email}" style="color:#C9A86A;">${photographer.email}</a>.
        </p>
      `;

      const html = baseHtmlTemplate(title, preheader, content);
      const text = `BOOKING CONFIRMED (${booking.booking_reference})\n\nPhotographer: ${photographer.name}\nDate: ${booking.booking_date} (${booking.start_time} - ${booking.end_time})\nPackage: ${booking.service_name || service?.name}\nTotal: ${booking.currency || 'EUR'} ${booking.price}\n\nThank you for choosing MOSAIC STUDIO.`;

      const info = await trans.sendMail({
        from: FROM_HEADER,
        to: booking.customer_email,
        subject: `[MOSAIC] Session Confirmed — ${photographer.name} (${booking.booking_reference})`,
        text,
        html,
      });

      console.log(`[Email] Booking confirmation sent to client (${booking.customer_email}): ${info.messageId || 'local-stream'}`);
      return info;
    } catch (err: any) {
      console.warn(`[Email] Could not dispatch confirmation email: ${err.message}`);
    }
  },

  /**
   * Dispatches booking declined notification to customer
   */
  async sendBookingDeclinedToCustomer(
    booking: BookingRecord,
    photographer: ProfileRecord,
    service?: ServiceRecord | null,
    reason?: string
  ) {
    try {
      const trans = getTransporter();
      const title = `Booking Update: ${booking.booking_reference}`;
      const preheader = `Update regarding your reservation inquiry with ${photographer.name}`;

      const content = `
        <span class="badge" style="background-color:#291414; border-color:#5A2626; color:#D65252;">Declined • Schedule Conflict</span>
        <h1 class="title">Session Inquiry Update</h1>
        <p class="text">
          Dear <strong>${booking.customer_name}</strong>,<br>
          Thank you for your interest in commissioning a session with <strong>${photographer.name}</strong>. Unfortunately, the studio cannot accept your reservation for <strong>${booking.booking_date}</strong> at this time due to schedule commitments.
        </p>

        ${reason ? `
        <div class="card" style="border-color:#3A2222;">
          <div class="card-label" style="color:#C9A86A; margin-bottom:6px;">Photographer Note</div>
          <div style="font-size:13px; color:#CCCCCC; font-style:italic;">"${reason}"</div>
        </div>` : ''}

        <p class="text">
          You are welcome to visit the photographer's studio to select an alternative date or explore other available packages.
        </p>
      `;

      const html = baseHtmlTemplate(title, preheader, content);
      const text = `BOOKING INQUIRY DECLINED (${booking.booking_reference})\n\nPhotographer: ${photographer.name}\nDate: ${booking.booking_date}\n\n${reason ? `Note: ${reason}\n\n` : ''}Please visit the studio to propose an alternate time.`;

      const info = await trans.sendMail({
        from: FROM_HEADER,
        to: booking.customer_email,
        subject: `[MOSAIC] Booking Update — ${photographer.name} (${booking.booking_reference})`,
        text,
        html,
      });

      return info;
    } catch (err: any) {
      console.warn(`[Email] Could not dispatch decline notice: ${err.message}`);
    }
  },

  /**
   * Dispatches rescheduled notification to customer
   */
  async sendBookingRescheduledToCustomer(
    booking: BookingRecord,
    photographer: ProfileRecord,
    service?: ServiceRecord | null,
    oldDate?: string,
    oldStartTime?: string
  ) {
    try {
      const trans = getTransporter();
      const title = `Session Rescheduled: ${booking.booking_reference}`;
      const preheader = `Your photography session with ${photographer.name} has been rescheduled`;

      const content = `
        <span class="badge" style="background-color:#292514; border-color:#5A4A26; color:#D6B852;">Rescheduled • Date Updated</span>
        <h1 class="title">Session Rescheduled</h1>
        <p class="text">
          Dear <strong>${booking.customer_name}</strong>,<br>
          Your photography session with <strong>${photographer.name}</strong> has been updated to a new time slot.
        </p>

        <div class="card">
          <div class="card-row">
            <span class="card-label">Booking Reference</span>
            <span class="card-value highlight-gold">${booking.booking_reference}</span>
          </div>
          ${oldDate ? `
          <div class="card-row">
            <span class="card-label">Previous Slot</span>
            <span class="card-value" style="color:#888888; text-decoration:line-through;">${oldDate} • ${oldStartTime}</span>
          </div>` : ''}
          <div class="card-row">
            <span class="card-label">New Date & Time</span>
            <span class="card-value highlight-gold">${booking.booking_date} • ${booking.start_time} - ${booking.end_time}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Package</span>
            <span class="card-value">${booking.service_name || service?.name || 'Photography Package'}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Photographer</span>
            <span class="card-value">${photographer.name}</span>
          </div>
        </div>

        <p class="text">
          If this new schedule does not suit your calendar, please contact the photographer directly at <a href="mailto:${photographer.email}" style="color:#C9A86A;">${photographer.email}</a>.
        </p>
      `;

      const html = baseHtmlTemplate(title, preheader, content);
      const text = `SESSION RESCHEDULED (${booking.booking_reference})\n\nPhotographer: ${photographer.name}\nNew Date: ${booking.booking_date} (${booking.start_time} - ${booking.end_time})\nPackage: ${booking.service_name || service?.name}`;

      const info = await trans.sendMail({
        from: FROM_HEADER,
        to: booking.customer_email,
        subject: `[MOSAIC] Session Rescheduled — ${photographer.name} (${booking.booking_reference})`,
        text,
        html,
      });

      return info;
    } catch (err: any) {
      console.warn(`[Email] Could not dispatch reschedule notice: ${err.message}`);
    }
  },

  /**
   * Dispatches cancellation notice
   */
  async sendBookingCancelledNotification(
    booking: BookingRecord,
    photographer: ProfileRecord,
    service?: ServiceRecord | null,
    cancelledBy: 'photographer' | 'customer' = 'photographer'
  ) {
    try {
      const trans = getTransporter();
      const recipient = cancelledBy === 'photographer' ? booking.customer_email : photographer.email;
      const title = `Booking Cancelled: ${booking.booking_reference}`;
      const preheader = `Reservation ${booking.booking_reference} has been cancelled`;

      const content = `
        <span class="badge" style="background-color:#291414; border-color:#5A2626; color:#D65252;">Cancelled</span>
        <h1 class="title">Session Booking Cancelled</h1>
        <p class="text">
          The following photography session reservation has been officially cancelled.
        </p>

        <div class="card">
          <div class="card-row">
            <span class="card-label">Booking Reference</span>
            <span class="card-value highlight-gold">${booking.booking_reference}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Service</span>
            <span class="card-value">${booking.service_name || service?.name || 'Photography Session'}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Scheduled Date</span>
            <span class="card-value">${booking.booking_date} (${booking.start_time} - ${booking.end_time})</span>
          </div>
          <div class="card-row">
            <span class="card-label">Client</span>
            <span class="card-value">${booking.customer_name}</span>
          </div>
        </div>
      `;

      const html = baseHtmlTemplate(title, preheader, content);
      const text = `BOOKING CANCELLED (${booking.booking_reference})\n\nService: ${booking.service_name || service?.name}\nDate: ${booking.booking_date}\nClient: ${booking.customer_name}`;

      const info = await trans.sendMail({
        from: FROM_HEADER,
        to: recipient,
        subject: `[MOSAIC] Booking Cancelled (${booking.booking_reference})`,
        text,
        html,
      });

      return info;
    } catch (err: any) {
      console.warn(`[Email] Could not dispatch cancellation notice: ${err.message}`);
    }
  },
};
