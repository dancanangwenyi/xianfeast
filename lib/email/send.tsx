/**
 * Email sending utilities
 * TODO: Integrate with your email provider (SendGrid, Resend, etc.)
 */

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  // TODO: Implement actual email sending
  // For now, just log to console
  console.log("[EMAIL] Sending email:")
  console.log(`To: ${options.to}`)
  console.log(`Subject: ${options.subject}`)
  console.log(`Body: ${options.text || options.html}`)

  // In production, use your email provider:
  // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     personalizations: [{ to: [{ email: options.to }] }],
  //     from: { email: process.env.EMAIL_FROM },
  //     subject: options.subject,
  //     content: [{ type: 'text/html', value: options.html }],
  //   }),
  // })
}

/**
 * Send magic link invite email
 */
export async function sendMagicLinkEmail(email: string, magicLink: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Your XianFeast Invitation",
    html: `
      <h1>Welcome to XianFeast!</h1>
      <p>You've been invited to join XianFeast (The Immortal Dining).</p>
      <p>Click the link below to set up your account:</p>
      <p><a href="${magicLink}">${magicLink}</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this invitation, please ignore this email.</p>
    `,
    text: `Welcome to XianFeast! Click this link to set up your account: ${magicLink} (expires in 24 hours)`,
  })
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(email: string, code: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Your XianFeast Verification Code",
    html: `
      <h1>Verification Code</h1>
      <p>Your verification code is:</p>
      <h2 style="font-size: 32px; letter-spacing: 8px; font-family: monospace;">${code}</h2>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `,
    text: `Your XianFeast verification code is: ${code} (expires in 5 minutes)`,
  })
}
