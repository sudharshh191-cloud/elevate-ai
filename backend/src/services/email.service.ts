import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    if (ENV.SMTP_USER && ENV.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST || 'smtp.gmail.com',
        port: Number(ENV.SMTP_PORT) || 465,
        secure: ENV.SMTP_SECURE !== false,
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS, // Google App Password
        },
      });
      return this.transporter;
    }

    return null;
  }

  /**
   * Dispatches a 6-digit OTP code to the recipient's email address
   */
  static async sendOtpEmail(
    toEmail: string,
    otp: string,
    type: 'login' | 'reset_password' | 'verification' = 'login'
  ): Promise<{ success: boolean; simulated?: boolean }> {
    const transporter = this.getTransporter();

    const subjectMap = {
      login: 'Your ELEVATE.AI Sign-In One-Time Passcode',
      reset_password: 'Reset Your ELEVATE.AI Password — Security Code',
      verification: 'Verify Your ELEVATE.AI Engineering Account',
    };

    const actionTextMap = {
      login: 'sign into your candidate account',
      reset_password: 'reset your account password',
      verification: 'verify your new developer account',
    };

    const subject = subjectMap[type] || subjectMap.login;
    const actionText = actionTextMap[type] || actionTextMap.login;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B0F19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" max-width="520" style="max-width: 520px; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 30px 40px 20px 40px; background: linear-gradient(135deg, #1E1B4B 0%, #111827 100%); border-bottom: 1px solid rgba(99, 102, 241, 0.2); text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background-color: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 8px; margin-bottom: 12px;">
                <span style="color: #818CF8; font-size: 14px; font-weight: 800; letter-spacing: 1px;">ELEVATE<span style="color: #10B981;">.AI</span></span>
              </div>
              <h1 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Security Verification Code</h1>
              <p style="color: #94A3B8; font-size: 12px; margin: 6px 0 0 0;">Staff & Principal AI Mock Interview Arena</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 40px 25px 40px;">
              <p style="color: #E2E8F0; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">Hello,</p>
              <p style="color: #94A3B8; font-size: 13px; line-height: 22px; margin: 0 0 25px 0;">
                We received a request to <strong style="color: #F8FAFC;">${actionText}</strong> for <span style="color: #818CF8; font-family: monospace;">${toEmail}</span>. Use the 6-digit verification passcode below to complete your authentication:
              </p>

              <!-- High Contrast OTP Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 25px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 18px 36px; background-color: #0B0F19; border: 2px solid #6366F1; border-radius: 12px; text-align: center; box-shadow: 0 0 25px rgba(99, 102, 241, 0.3);">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; color: #FFFFFF; letter-spacing: 10px; margin-left: 10px;">${otp}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Info & Expiry -->
              <div style="background-color: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 14px 18px; margin: 25px 0 10px 0;">
                <p style="color: #F59E0B; font-size: 12px; font-weight: 600; margin: 0 0 4px 0;">
                  ⏱️ Code expires in 10 minutes
                </p>
                <p style="color: #64748B; font-size: 11px; line-height: 16px; margin: 0;">
                  For security, never share this code with anyone. ELEVATE.AI engineers will never ask for your verification passcode.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #0B0F19; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="color: #475569; font-size: 11px; margin: 0 0 6px 0;">
                If you did not request this verification code, you can safely ignore this email.
              </p>
              <p style="color: #334155; font-size: 10px; margin: 0;">
                © 2026 ELEVATE.AI Enterprise Platform. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    if (!transporter) {
      console.error('❌ [SMTP Error]: SMTP configuration missing. Please verify SMTP_USER and SMTP_PASS in backend/.env');
      throw new Error('SMTP email configuration is missing or invalid in backend/.env. Cannot send verification email.');
    }

    try {
      await transporter.sendMail({
        from: ENV.SMTP_FROM || `ELEVATE.AI Security <${ENV.SMTP_USER}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`📧 [SMTP] OTP email sent successfully to ${toEmail}`);
      return { success: true };
    } catch (err: any) {
      console.error(`❌ [SMTP Error]: Failed to send OTP email to ${toEmail}:`, err.message);
      throw new Error(`Failed to deliver verification email to ${toEmail}: ${err.message}`);
    }
  }

  /**
   * Dispatches a secure, single-use password reset link via Nodemailer SMTP
   */
  static async sendPasswordResetEmail(
    toEmail: string,
    resetLink: string,
    recipientName: string = 'Engineer'
  ): Promise<{ success: boolean; simulated?: boolean }> {
    const transporter = this.getTransporter();
    const subject = 'Reset Your ELEVATE.AI Password';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B0F19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" max-width="540" style="max-width: 540px; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 30px 40px 20px 40px; background: linear-gradient(135deg, #1E1B4B 0%, #111827 100%); border-bottom: 1px solid rgba(99, 102, 241, 0.2); text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background-color: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 8px; margin-bottom: 12px;">
                <span style="color: #818CF8; font-size: 14px; font-weight: 800; letter-spacing: 1px;">ELEVATE<span style="color: #10B981;">.AI</span></span>
              </div>
              <h1 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Password Reset Request</h1>
              <p style="color: #94A3B8; font-size: 12px; margin: 6px 0 0 0;">Staff & Principal AI Mock Interview Arena</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 40px 25px 40px;">
              <p style="color: #E2E8F0; font-size: 14px; line-height: 22px; margin: 0 0 16px 0;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="color: #94A3B8; font-size: 13px; line-height: 22px; margin: 0 0 25px 0;">
                We received a request to reset your password for your ELEVATE.AI account associated with <span style="color: #818CF8; font-family: monospace;">${toEmail}</span>. Click the button below to choose a new password:
              </p>

              <!-- Reset Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); letter-spacing: 0.3px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Alert -->
              <div style="background-color: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 14px 18px; margin: 25px 0 10px 0;">
                <p style="color: #F59E0B; font-size: 12px; font-weight: 600; margin: 0 0 4px 0;">
                  ⏱️ Security Notice
                </p>
                <p style="color: #64748B; font-size: 11px; line-height: 16px; margin: 0;">
                  This link expires in <strong>15 minutes</strong> and can only be used once. If you did not request a password reset, you can safely ignore this email. Your current password remains unchanged.
                </p>
              </div>

              <p style="color: #475569; font-size: 11px; line-height: 16px; margin: 20px 0 0 0; word-break: break-all;">
                If the button above does not work, copy and paste this URL into your browser:<br/>
                <a href="${resetLink}" style="color: #818CF8; text-decoration: underline;">${resetLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #0B0F19; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="color: #475569; font-size: 11px; margin: 0 0 6px 0;">
                Regards,<br/>The ELEVATE.AI Engineering Team
              </p>
              <p style="color: #334155; font-size: 10px; margin: 0;">
                © 2026 ELEVATE.AI Platform. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    if (!transporter) {
      console.error('❌ [SMTP Error]: SMTP configuration missing. Please verify SMTP_USER and SMTP_PASS in backend/.env');
      throw new Error('SMTP email configuration is missing or invalid in backend/.env. Cannot send password reset email.');
    }

    try {
      await transporter.sendMail({
        from: ENV.SMTP_FROM || `ELEVATE.AI Security <${ENV.SMTP_USER}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`📧 [SMTP] Password reset link sent successfully to ${toEmail}`);
      return { success: true };
    } catch (err: any) {
      console.error(`❌ [SMTP Error]: Failed to send password reset email to ${toEmail}:`, err.message);
      throw new Error(`Failed to deliver password reset email to ${toEmail}: ${err.message}`);
    }
  }
}
