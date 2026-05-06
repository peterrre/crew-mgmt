import nodemailer from 'nodemailer';

// Configure SMTP transporter from env vars (with sensible defaults for dev)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for others
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' }
    : undefined,
});

const FROM_ADDRESS = process.env.EMAIL_FROM || 'Crew Management <noreply@crewmgmt.local>';

interface BaseEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: BaseEmailOptions) {
  try {
    const result = await transporter.sendMail({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${subject} (ID: ${result.messageId})`);
    return { success: true as const, messageId: result.messageId };
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error);
    return { success: false as const, error: String(error) };
  }
}

export const emailService = {
  async sendShiftAssigned(options: { to: string; shiftTitle: string; volunteerName: string }) {
    return sendEmail({
      to: options.to,
      subject: `Schicht zugewiesen: ${options.shiftTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1d1d1f;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px;">Hallo ${options.volunteerName},</h2>
          <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px;">
            dir wurde eine neue Schicht zugewiesen:
          </p>
          <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin: 0 0 16px;">
            <p style="font-size: 15px; font-weight: 600; margin: 0;">${options.shiftTitle}</p>
          </div>
          <p style="font-size: 13px; color: #86868b; margin: 0;">
            Bitte melde dich an, um die Details einzusehen.
          </p>
        </div>
      `,
    });
  },

  async sendShiftChanged(options: { to: string; shiftTitle: string; changes: string }) {
    return sendEmail({
      to: options.to,
      subject: `Schicht geändert: ${options.shiftTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1d1d1f;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px;">Schichtänderung</h2>
          <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px;">
            Die Schicht <strong>${options.shiftTitle}</strong> wurde geändert:
          </p>
          <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin: 0 0 16px;">
            <p style="font-size: 14px; margin: 0;">${options.changes}</p>
          </div>
        </div>
      `,
    });
  },

  async sendApplicationApproved(options: { to: string; eventName: string; volunteerName: string }) {
    return sendEmail({
      to: options.to,
      subject: `Bewerbung genehmigt: ${options.eventName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1d1d1f;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px;">Hallo ${options.volunteerName},</h2>
          <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px;">
            deine Bewerbung für <strong>${options.eventName}</strong> wurde <span style="color: #30d158; font-weight: 600;">genehmigt</span>! 🎉
          </p>
          <p style="font-size: 13px; color: #86868b; margin: 0;">
            Melde dich an, um deine Schichten einzusehen.
          </p>
        </div>
      `,
    });
  },

  async sendApplicationRejected(options: { to: string; eventName: string; volunteerName: string }) {
    return sendEmail({
      to: options.to,
      subject: `Bewerbung aktualisiert: ${options.eventName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1d1d1f;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px;">Hallo ${options.volunteerName},</h2>
          <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px;">
            deine Bewerbung für <strong>${options.eventName}</strong> wurde leider <span style="color: #ff453a; font-weight: 600;">abgelehnt</span>.
          </p>
          <p style="font-size: 13px; color: #86868b; margin: 0;">
            Kontaktiere den Crew-Manager bei Fragen.
          </p>
        </div>
      `,
    });
  },

  async sendReminder(options: { to: string; shiftTitle: string; when: '24h' | '2h' }) {
    const urgency = options.when === '2h' ? 'beginnt bald' : 'morgen';
    return sendEmail({
      to: options.to,
      subject: `⏰ Erinnerung: ${options.shiftTitle} ${urgency}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1d1d1f;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px;">Schicht-Erinnerung ⏰</h2>
          <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px;">
            Deine Schicht <strong>${options.shiftTitle}</strong> ${urgency}.
          </p>
          <div style="background: ${options.when === '2h' ? '#fef2f2' : '#f5f5f7'}; border-radius: 12px; padding: 16px; margin: 0 0 16px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; margin: 0;">
              ${options.when === '2h' ? '2 Stunden' : '24 Stunden'}
            </p>
            <p style="font-size: 13px; color: #86868b; margin: 4px 0 0;">verbleibend</p>
          </div>
        </div>
      `,
    });
  },
};
