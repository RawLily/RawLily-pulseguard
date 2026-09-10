import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'noreply@pulseguardhq.xyz';
const SUPPORT_EMAIL = 'support@pulseguardhq.xyz';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo = SUPPORT_EMAIL
}: EmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || stripHtml(html),
      reply_to: replyTo
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'email-service',
        to: Array.isArray(to) ? to.join(', ') : to
      }
    });

    console.error('[Email] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3b82f6;">Welcome to PulseGuard! 🛡️</h1>
          <p>Hi ${escapeHtml(name)},</p>
          <p>Thank you for signing up for PulseGuard. We're excited to help you monitor bugs and security threats in real-time.</p>
          
          <h2 style="color: #1f2937; margin-top: 30px;">Next Steps:</h2>
          <ol>
            <li><a href="https://pulseguardhq.xyz/docs" style="color: #3b82f6;">Documentation</a></li>
            <li><a href="https://pulseguardhq.xyz/dashboard" style="color: #3b82f6;">Access Your Dashboard</a></li>
            <li>Start integrating the API</li>
          </ol>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color: #3b82f6;">Contact support</a>
          </p>

          <p style="margin-top: 20px; color: #999; font-size: 12px;">
            © 2026 PulseGuard. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to PulseGuard',
    html,
    text: `Welcome to PulseGuard! Visit https://pulseguardhq.xyz/dashboard to get started.`
  });
}

export async function sendCriticalAlertEmail(
  email: string,
  eventTitle: string,
  eventDescription: string,
  eventType: 'bug' | 'security'
) {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <h2 style="color: #991b1b; margin: 0;">🚨 Critical Alert</h2>
          </div>

          <h3 style="color: #1f2937;">Event Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 10px; font-weight: bold;">Type:</td>
              <td style="padding: 10px;">${eventType === 'bug' ? '🐛 Bug' : '🔒 Security'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Title:</td>
              <td style="padding: 10px;">${escapeHtml(eventTitle)}</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 10px; font-weight: bold;">Description:</td>
              <td style="padding: 10px;">${escapeHtml(eventDescription).replace(/\n/g, '<br>')}</td>
            </tr>
          </table>

          <div style="margin-top: 30px;">
            <a href="https://pulseguardhq.xyz/dashboard" style="
              display: inline-block;
              background-color: #dc2626;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              font-weight: bold;
            ">
              View in Dashboard
            </a>
          </div>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
            You received this email because critical alerts are enabled in PulseGuard.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🚨 Critical Alert: ${eventTitle}`,
    html
  });
}

export async function sendPaymentReceiptEmail(
  email: string,
  planName: string,
  amount: number,
  currency: string = 'USD'
) {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3b82f6;">Payment Confirmation ✅</h1>
          <p>Thank you for subscribing to PulseGuard!</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 10px; font-weight: bold;">Plan:</td>
              <td style="padding: 10px;">${escapeHtml(planName)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Amount:</td>
              <td style="padding: 10px;">${currency} $${(amount / 100).toFixed(2)}</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 10px; font-weight: bold;">Status:</td>
              <td style="padding: 10px; color: #16a34a;">Active</td>
            </tr>
          </table>

          <p style="margin-top: 30px;">
            <a href="https://pulseguardhq.xyz/dashboard/settings" style="color: #3b82f6;">Manage your subscription</a>
          </p>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
            © 2026 PulseGuard. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Payment Confirmation - PulseGuard Subscription',
    html
  });
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&');
}
