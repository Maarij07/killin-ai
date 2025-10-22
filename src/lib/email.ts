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
  const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || '';
  const friendlyName = process.env.SMTP_FROM_NAME;
  const fromHeader = friendlyName ? `${friendlyName} <${from}>` : from;

  const subject = 'Your verification code';
  
  const text = `Hi${username ? ' ' + username : ''}, your verification code is ${code}. It expires in 10 minutes.`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #FE5B02; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Email Verification</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Please verify your email address</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #eaeaea; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Hello${username ? ' ' + username : ''}!</h2>
            
            <p>Thank you for signing up with Kallin.AI. To complete your registration, please use the verification code below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; padding: 15px 25px; background-color: #fff0e6; border: 2px solid #FE5B02; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #FE5B02;">
                    ${code}
                </div>
            </div>
            
            <p style="background-color: #fff8e6; padding: 15px; border-left: 4px solid #FE5B02; border-radius: 4px;">
                <strong>Note:</strong> This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
            
            <div style="margin-top: 30px; text-align: center;">
                <p style="margin: 0; color: #666;">
                    Thank you for choosing Kallin.AI
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2025 Kallin.AI. All rights reserved.</p>
        </div>
    </body>
    </html>
  `;

  await transporter.sendMail({ from: fromHeader, to, subject, text, html });
}

export async function sendContactSalesEmail(formData: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  city: string;
  state: string;
  services: string;
  customMinutes?: string;
}) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || '';
  const friendlyName = process.env.SMTP_FROM_NAME;
  const fromHeader = friendlyName ? `${friendlyName} <${from}>` : from;
  const to = process.env.CONTACT_SALES_EMAIL || from;

  const subject = `Contact Sales Request from ${formData.firstName} ${formData.lastName}`;
  
  const text = `
New Contact Sales Request:

Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phoneNumber}
Company: ${formData.companyName}
Location: ${formData.city}, ${formData.state}
Services Interested In: ${formData.services}${formData.services === 'Custom Minutes' && formData.customMinutes ? `
Custom Minutes Requested: ${formData.customMinutes}` : ''}
`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Sales Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #FE5B02; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">New Contact Sales Request</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">A potential customer is interested in your services</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #eaeaea; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px;">Customer Details</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                    <td style="padding: 12px; border-bottom: 2px solid #1a1a1a; font-weight: bold; width: 30%;">Name:</td>
                    <td style="padding: 12px; border-bottom: 2px solid #1a1a1a;">${formData.firstName} ${formData.lastName}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 2px solid #1a1a1a; font-weight: bold;">Email:</td>
                    <td style="padding: 12px; border-bottom: 2px solid #1a1a1a;">
                        <a href="mailto:${formData.email}" style="color: #FE5B02; text-decoration: none;">${formData.email}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 2px solid #1a1a1a; font-weight: bold;">Phone:</td>
                    <td style="padding: 12px; border-bottom: 2px solid #1a1a1a;">
                        <a href="tel:${formData.phoneNumber}" style="color: #FE5B02; text-decoration: none;">${formData.phoneNumber}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 2px solid #1a1a1a; font-weight: bold;">Company:</td>
                    <td style="padding: 12px; border-bottom: 2px solid #1a1a1a;">${formData.companyName}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 2px solid #1a1a1a; font-weight: bold;">Location:</td>
                    <td style="padding: 12px; border-bottom: 2px solid #1a1a1a;">${formData.city}, ${formData.state}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 2px solid #1a1a1a; font-weight: bold;">Services Interested:</td>
                    <td style="padding: 12px; border-bottom: 2px solid #1a1a1a;">
                        <span style="background-color: #fff0e6; color: #FE5B02; padding: 6px 10px; border-radius: 4px; display: inline-block; font-weight: bold;">
                            ${formData.services}
                        </span>
                        ${formData.services === 'Custom Minutes' && formData.customMinutes ? `
                        <div style="margin-top: 10px; padding: 10px; background-color: #e6f7ff; border-left: 4px solid #1890ff; border-radius: 4px;">
                            <strong>Custom Minutes Requested:</strong> ${formData.customMinutes}
                        </div>
                        ` : ''}
                    </td>
                </tr>
            </table>
            
            <div style="margin-top: 30px; text-align: center; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
                <p style="margin: 0; color: #666;">
                    Please follow up with this potential customer as soon as possible.
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This email was sent from your Kallin.AI contact form</p>
        </div>
    </body>
    </html>
  `;

  console.log('Sending contact sales email...', { from: fromHeader, to, subject });
  await transporter.sendMail({ from: fromHeader, to, subject, text, html });
  console.log('Contact sales email sent successfully');
}
