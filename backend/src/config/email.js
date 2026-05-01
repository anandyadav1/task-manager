import nodemailer from 'nodemailer';

let transporter;

if (process.env.NODE_ENV === 'production' && process.env.EMAIL_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else {
  // Development: log emails to console
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('═══════════════════════════════════════════');
      console.log('📧 EMAIL (Dev Mode - Not Actually Sent)');
      console.log('═══════════════════════════════════════════');
      console.log(`To:      ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body:    ${mailOptions.text || mailOptions.html}`);
      console.log('═══════════════════════════════════════════');
      return { messageId: 'dev-mode-' + Date.now() };
    },
  };
}

/**
 * Send an email using the configured transporter
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Team Task Manager <noreply@taskmanager.com>',
      to,
      subject,
      html,
      text,
    });
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('📧 Email send error:', error.message);
    // Don't throw — email failures shouldn't crash the app
  }
};

export default transporter;
