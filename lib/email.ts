import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SecurityDetails {
  ip: string;
  location: string;
  device: string;
  flag?: string;
}

export const sendPasswordResetEmail = async (email: string, resetLink: string, details?: SecurityDetails) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'ByteHack Security <huntiez@bytehack.net>',
      to: [email],
      subject: 'Reset your ByteHack password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #fff; letter-spacing: 2px; }
            .content { background-color: #09090b; padding: 40px; border-radius: 12px; border: 1px solid #27272a; text-align: center; }
            .title { font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #fff; }
            .text { color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
            .button { display: inline-block; background-color: #fff; color: #000; padding: 14px 32px; border-radius: 9999px; font-weight: 600; text-decoration: none; font-size: 16px; transition: opacity 0.2s; }
            .button:hover { opacity: 0.9; }
            .footer { margin-top: 40px; text-align: center; color: #52525b; font-size: 12px; }
            .link { color: #71717a; text-decoration: underline; word-break: break-all; }
            .security-box { background-color: #18181b; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: left; font-size: 14px; border: 1px solid #27272a; }
            .security-row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #27272a; padding-bottom: 8px; }
            .security-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
            .label { color: #71717a; }
            .value { color: #fff; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">BYTEHACK</div>
            </div>
            <div class="content">
              <h1 class="title">Reset Your Password</h1>
              <p class="text">
                We received a request to reset the password for your ByteHack account. 
                Click the button below to proceed. This link expires in 1 hour.
              </p>
              <a href="${resetLink}" class="button">Reset Password</a>
              
              <p class="text" style="margin-top: 32px; font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetLink}" class="link">${resetLink}</a>
              </p>

              ${details ? `
              <div class="security-box">
                  <div style="margin-bottom: 15px; font-weight: 600; color: #fff; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Request Details</div>
                  <div class="security-row">
                      <span class="label">IP Address</span>
                      <span class="value">${details.ip}</span>
                  </div>
                  <div class="security-row">
                      <span class="label">Location</span>
                      <span class="value">${details.flag ? details.flag + ' ' : ''}${details.location}</span>
                  </div>
                  <div class="security-row">
                      <span class="label">Device</span>
                      <span class="value">${details.device}</span>
                  </div>
                  <div style="margin-top: 15px; font-size: 12px; color: #71717a;">
                      If you did not request this change, you can safely ignore this email.
                  </div>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ByteHack. All rights reserved.</p>
              <p>You received this email because a password reset was requested for your account.</p>
              <p>ByteHack Inc. • 123 Security Blvd</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception sending email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (email: string, code: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'ByteHack Security <security@bytehack.net>',
      to: [email],
      subject: 'Verify your ByteHack email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Email</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #fff; letter-spacing: 2px; }
            .content { background-color: #09090b; padding: 40px; border-radius: 12px; border: 1px solid #27272a; text-align: center; }
            .title { font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #fff; }
            .text { color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
            .code-box { background-color: #18181b; padding: 24px; border-radius: 8px; margin: 32px 0; border: 1px solid #27272a; }
            .code { font-size: 32px; font-weight: bold; color: #fff; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; }
            .footer { margin-top: 40px; text-align: center; color: #52525b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">BYTEHACK</div>
            </div>
            <div class="content">
              <h1 class="title">Verify Your Email</h1>
              <p class="text">
                Use the verification code below to confirm your email address. 
                This code will expire in 15 minutes.
              </p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <p class="text" style="font-size: 14px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ByteHack. All rights reserved.</p>
              <p>ByteHack Inc. • 123 Security Blvd</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception sending verification email:', error);
    return false;
  }
};
