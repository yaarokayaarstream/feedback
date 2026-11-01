import nodemailer from 'nodemailer';

const TARGET_GMAIL = process.env.FEEDBACK_RECIPIENT_EMAIL || 'gabbar.singh9291@gmail.com';
const SMTP_USER = process.env.SMTP_USER || 'gabbar.singh9291@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'xnpcraavgnyywwda';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE !== 'false';

export default async function handler(req: any, res: any) {
  // CORS Headers for cross-domain requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { notes, name, email, category, rating } = req.body || {};

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

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

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
      Sent directly via Gmail SMTP to ${TARGET_GMAIL}
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: `"Welcome App Feedback" <${SMTP_USER}>`,
      to: TARGET_GMAIL,
      replyTo: email?.trim() ? email.trim() : undefined,
      subject: emailSubject,
      text: `New Feedback from ${senderName} (${senderEmail}) to ${TARGET_GMAIL}\n\nCategory: ${feedbackCategory}\nRating: ${stars}\nTime: ${submittedAt}\n\nNotes:\n${notes.trim()}`,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Vercel Serverless SMTP Sent] MessageId: ${info.messageId}`);

    return res.status(200).json({
      success: true,
      message: 'Feedback successfully sent to Yaaro Ka Yaar!',
      targetEmail: TARGET_GMAIL,
      messageId: info.messageId,
    });
  } catch (err: any) {
    console.error('[Vercel Serverless SMTP Error]:', err);
    return res.status(500).json({
      success: false,
      error: `Failed to deliver feedback via SMTP: ${err?.message || 'Server error'}`,
    });
  }
}
