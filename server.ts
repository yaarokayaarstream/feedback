import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer, { type Transporter } from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_GMAIL = process.env.FEEDBACK_RECIPIENT_EMAIL || 'gabbar.singh9291@gmail.com';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Full Screen Welcome Display with Feedback API',
      timestamp: new Date().toISOString(),
    });
  });

  // SMTP Feedback endpoint
  app.post('/api/feedback', async (req, res) => {
    try {
      const { notes, name, email, category, rating } = req.body;

      if (!notes || typeof notes !== 'string' || !notes.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Feedback notes cannot be empty.',
        });
      }

      const senderName = name?.trim() || 'Anonymous Visitor';
      const senderEmail = email?.trim() || 'noreply@welcome-app.local';
      const feedbackCategory = category?.trim() || 'General Feedback';
      const submittedAt = new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
      });

      console.log(`[Feedback Received] from "${senderName}" (${senderEmail}): ${notes.substring(0, 60)}...`);

      // Determine Transporter Configuration
      let transporter: Transporter;
      let isSimulated = false;
      let previewUrl: string | false = false;

      const hasSmtpCredentials = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

      if (hasSmtpCredentials) {
        // Use user-provided SMTP credentials
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 465,
          secure: process.env.SMTP_SECURE !== 'false',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Create an Ethereal test transporter for local preview if live credentials aren't set yet
        try {
          const testAccount = await nodemailer.createTestAccount();
          transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          isSimulated = true;
        } catch {
          // Fallback to json transport if network fails
          transporter = nodemailer.createTransport({
            jsonTransport: true,
          });
          isSimulated = true;
        }
      }

      const emailSubject = `[Welcome App Feedback] ${feedbackCategory} from ${senderName}`;

      const stars = rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : 'Not specified';

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #ffffff; padding: 24px; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
    .header p { margin: 0; font-size: 13px; opacity: 0.8; }
    .content { padding: 24px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    .meta-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .meta-table td.label { font-weight: 600; color: #64748b; width: 130px; }
    .notes-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 16px 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap; color: #0f172a; }
    .footer { padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Feedback Submission</h1>
      <p>Received for Full Screen Welcome Web App</p>
    </div>
    <div class="content">
      <table class="meta-table">
        <tr>
          <td class="label">Target Recipient:</td>
          <td><strong>${TARGET_GMAIL}</strong></td>
        </tr>
        <tr>
          <td class="label">From Name:</td>
          <td>${senderName}</td>
        </tr>
        <tr>
          <td class="label">Reply-To Email:</td>
          <td>${email?.trim() ? `<a href="mailto:${email.trim()}">${email.trim()}</a>` : 'Not provided'}</td>
        </tr>
        <tr>
          <td class="label">Category:</td>
          <td>${feedbackCategory}</td>
        </tr>
        <tr>
          <td class="label">Rating:</td>
          <td>${stars}</td>
        </tr>
        <tr>
          <td class="label">Submitted Date:</td>
          <td>${submittedAt}</td>
        </tr>
      </table>

      <h3 style="margin: 20px 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">User Notes & Message:</h3>
      <div class="notes-box">${notes.trim()}</div>
    </div>
    <div class="footer">
      Sent directly via SMTP backend to ${TARGET_GMAIL}
    </div>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: process.env.SMTP_FROM || `"Welcome App Feedback" <${process.env.SMTP_USER || 'feedback@welcome-app.local'}>`,
        to: TARGET_GMAIL,
        replyTo: email?.trim() ? email.trim() : undefined,
        subject: emailSubject,
        text: `New Feedback from ${senderName} (${senderEmail}) to ${TARGET_GMAIL}\n\nCategory: ${feedbackCategory}\nRating: ${stars}\nTime: ${submittedAt}\n\nNotes:\n${notes.trim()}`,
        html: emailHtml,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP Mail Sent] MessageId: ${info.messageId} to ${TARGET_GMAIL}`);

      if (isSimulated && nodemailer.getTestMessageUrl) {
        previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`[SMTP Preview URL]: ${previewUrl}`);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Feedback successfully sent to Yaaro Ka Yaar!',
        simulated: isSimulated,
        targetEmail: TARGET_GMAIL,
        previewUrl: previewUrl || undefined,
        messageId: info.messageId,
      });
    } catch (err) {
      console.error('[SMTP Send Error]:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown email sending error';
      return res.status(500).json({
        success: false,
        error: `Failed to deliver feedback via SMTP: ${errorMessage}`,
        targetEmail: TARGET_GMAIL,
      });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Welcome App fullstack server running at http://0.0.0.0:${PORT}`);
    console.log(`📧 Feedback target email: ${TARGET_GMAIL}\n`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
