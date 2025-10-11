import nodemailer from 'nodemailer';

// Create and cache a transporter across hot reloads
const g = globalThis as unknown as {
  __mailer?: ReturnType<typeof nodemailer.createTransport>;
};

export function getTransporter() {
  if (!g.__mailer) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error('SMTP configuration missing: please set SMTP_HOST, SMTP_USER, SMTP_PASS');
    }

    g.__mailer = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }
  return g.__mailer;
}

export async function sendVerificationEmail(to: string, code: string, username?: string) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';
  const friendlyName = process.env.SMTP_FROM_NAME;
  const fromHeader = friendlyName ? `${friendlyName} <${from}>` : from;

  const subject = 'Your verification code';
  const text = `Hi${username ? ' ' + username : ''}, your verification code is ${code}. It expires in 10 minutes.`;
  const html = `<p>Hi${username ? ' ' + username : ''},</p><p>Your verification code is <b>${code}</b>. It expires in 10 minutes.</p>`;

  await transporter.sendMail({ from: fromHeader, to, subject, text, html });
}
