/**
 * Email sending utilities using Nodemailer with Gmail SMTP
 */

import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'dancangwe@gmail.com',
    pass: process.env.SMTP_PASS || 'itru ttwr emzt vcbt'
  }
})

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    console.log("[EMAIL] Sending email:")
    console.log(`To: ${options.to}`)
    console.log(`Subject: ${options.subject}`)
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'dancangwe@gmail.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`✅ Email sent successfully! Message ID: ${result.messageId}`)
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    throw error
  }
}

export interface MagicLinkEmailOptions {
  to: string
  name: string
  token: string
  type: 'business_invitation' | 'password_reset' | 'user_invitation'
  businessName?: string
}

/**
 * Send magic link invite email
 */
export async function sendMagicLinkEmail(options: MagicLinkEmailOptions): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const magicLink = `${baseUrl}/auth/magic?token=${options.token}`
  
  let subject = "Your XianFeast Invitation"
  let content = ""
  
  switch (options.type) {
    case 'business_invitation':
      subject = `Welcome to XianFeast - ${options.businessName} Invitation`
      content = `
        <h1>Welcome to XianFeast!</h1>
        <p>Hi ${options.name},</p>
        <p>You've been invited to manage <strong>${options.businessName}</strong> on XianFeast (The Immortal Dining).</p>
        <p>Click the link below to set up your account and start managing your business:</p>
        <p><a href="${magicLink}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Set Up Account</a></p>
        <p>Or copy and paste this link: ${magicLink}</p>
        <p>This link will expire in 7 days.</p>
        <p>If you didn't request this invitation, please ignore this email.</p>
      `
      break
    case 'password_reset':
      subject = "Reset Your XianFeast Password"
      content = `
        <h1>Password Reset</h1>
        <p>Hi ${options.name},</p>
        <p>You requested to reset your password for XianFeast.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${magicLink}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
        <p>Or copy and paste this link: ${magicLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
      `
      break
    default:
      content = `
        <h1>Welcome to XianFeast!</h1>
        <p>Hi ${options.name},</p>
        <p>You've been invited to join XianFeast (The Immortal Dining).</p>
        <p>Click the link below to set up your account:</p>
        <p><a href="${magicLink}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Set Up Account</a></p>
        <p>Or copy and paste this link: ${magicLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this invitation, please ignore this email.</p>
      `
  }

  await sendEmail({
    to: options.to,
    subject,
    html: content,
    text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
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
