import { log } from 'console';

// Configure from env vars (with sensible defaults for dev)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || '';

interface BaseMessageOptions {
  to: string;
}

interface SMSOptions extends BaseMessageOptions {
  body: string;
}

interface PushOptions extends BaseMessageOptions {
  subject: string;
  body: string;
}

/**
 * Stub SMS service that logs the attempt and returns success.
 * In a real implementation, this would use Twilio.
 */
export async function sendSMS(options: SMSOptions) {
  try {
    console.log(`[SMS Stub] To: ${options.to}, Body: ${options.body}`);
    // In real implementation, we would use Twilio client here
    return { success: true as const, messageId: 'stub-sms-id' };
  } catch (error) {
    console.error(`[SMS Stub] Failed to send to ${options.to}:`, error);
    return { success: false as const, error: String(error) };
  }
}

/**
 * Stub Push service that logs the attempt and returns success.
 * In a real implementation, this would use SendGrid.
 */
export async function sendPush(options: PushOptions) {
  try {
    console.log(`[Push Stub] To: ${options.to}, Subject: ${options.subject}, Body: ${options.body}`);
    // In real implementation, we would use SendGrid client here
    return { success: true as const, messageId: 'stub-push-id' };
  } catch (error) {
    console.error(`[Push Stub] Failed to send to ${options.to}:`, error);
    return { success: false as const, error: String(error) };
  }
}

// Export a combined service object for consistency with emailService
export const smsPushService = {
  sendSMS,
  sendPush
};