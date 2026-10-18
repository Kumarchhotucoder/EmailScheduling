import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter = null;
let currentAccountInfo = null;

export async function getTransporter() {
  if (transporter) {
    return transporter;
  }

  let user = config.ethereal.user;
  let pass = config.ethereal.pass;

  // If credentials are not explicitly provided, create an automatic test account with Ethereal
  if (!user || !pass) {
    logger.info('No Ethereal credentials found in environment. Generating a test account automatically via Ethereal API...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      user = testAccount.user;
      pass = testAccount.pass;
      currentAccountInfo = {
        user,
        pass,
        web: `https://ethereal.email/login`,
      };
      logger.info(`Generated Ethereal Test Account successfully!`);
      logger.info(`Username: ${user}`);
      logger.info(`Web portal: ${currentAccountInfo.web}`);
    } catch (err) {
      logger.error(`Failed to auto-generate Ethereal test account: ${err.message}`);
      throw err;
    }
  } else {
    currentAccountInfo = {
      user,
      web: `https://ethereal.email/login`,
    };
  }

  transporter = nodemailer.createTransport({
    host: config.ethereal.host,
    port: config.ethereal.port,
    secure: false, // 587 uses STARTTLS
    auth: {
      user,
      pass,
    },
  });

  try {
    await transporter.verify();
    logger.info(`Ethereal SMTP transport verified and ready on ${config.ethereal.host}:${config.ethereal.port}`);
  } catch (err) {
    logger.warn(`Transporter verification warning: ${err.message}. Will retry on send.`);
  }

  return transporter;
}

export function getAccountInfo() {
  return currentAccountInfo;
}

export async function sendEmail({ to, subject, body }) {
  const mailClient = await getTransporter();

  const mailOptions = {
    from: config.emailFrom,
    to,
    subject,
    text: body,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; margin-top: 0;">${subject}</h2>
        <div style="color: #334155; line-height: 1.6; white-space: pre-wrap; margin-bottom: 24px;">${body}</div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Sent via Full-Stack Email Scheduling System • Test Delivery via Ethereal Email</p>
      </div>
    `,
  };

  const info = await mailClient.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
  };
}
