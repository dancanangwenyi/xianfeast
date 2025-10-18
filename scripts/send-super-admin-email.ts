#!/usr/bin/env tsx

/**
 * Send Super Admin Login Email
 * 
 * This script sends an email to dancangwe@gmail.com with login credentials.
 * 
 * Usage: npx tsx scripts/send-super-admin-email.ts
 */

import { sendEmail } from '../lib/email/send'
import { config } from 'dotenv'

// Load environment variables
config()

async function sendSuperAdminEmail() {
  console.log('📧 Sending Super Admin Login Email...\n')
  
  const email = 'dancangwe@gmail.com'
  const password = 'admin123'
  const loginUrl = 'http://localhost:3000/login'
  
  const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>XianFeast Super Admin Login Credentials</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
        .content { 
            padding: 40px 30px; 
        }
        .credentials { 
            background: #f8f9fa; 
            padding: 25px; 
            border-radius: 10px; 
            border-left: 5px solid #667eea; 
            margin: 25px 0; 
            font-family: 'Courier New', monospace;
        }
        .credential-item {
            margin: 15px 0;
            display: flex;
            align-items: center;
        }
        .credential-label {
            font-weight: 600;
            color: #495057;
            min-width: 80px;
            font-family: 'Segoe UI', sans-serif;
        }
        .credential-value {
            background: #e9ecef;
            padding: 8px 12px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-weight: 600;
            color: #495057;
            margin-left: 10px;
        }
        .warning { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 20px; 
            border-radius: 10px; 
            margin: 25px 0; 
            border-left: 5px solid #ffc107;
        }
        .warning h3 { margin: 0 0 10px 0; color: #856404; }
        .warning p { margin: 0; color: #856404; }
        .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0; 
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s ease;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .steps {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin: 25px 0;
        }
        .steps h3 {
            margin: 0 0 20px 0;
            color: #495057;
        }
        .steps ol {
            margin: 0;
            padding-left: 20px;
        }
        .steps li {
            margin: 10px 0;
            color: #495057;
        }
        .capabilities {
            background: #e8f5e8;
            padding: 25px;
            border-radius: 10px;
            margin: 25px 0;
            border-left: 5px solid #28a745;
        }
        .capabilities h3 {
            margin: 0 0 15px 0;
            color: #155724;
        }
        .capabilities ul {
            margin: 0;
            padding-left: 20px;
        }
        .capabilities li {
            margin: 8px 0;
            color: #155724;
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            color: #6c757d; 
            font-size: 14px; 
            padding: 20px;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
        }
        .highlight {
            background: #667eea;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to XianFeast!</h1>
            <p>Your Super Admin account is ready</p>
        </div>
        
        <div class="content">
            <h2>🔑 Login Credentials</h2>
            <div class="credentials">
                <div class="credential-item">
                    <span class="credential-label">Email:</span>
                    <span class="credential-value">${email}</span>
                </div>
                <div class="credential-item">
                    <span class="credential-label">Password:</span>
                    <span class="credential-value">${password}</span>
                </div>
                <div class="credential-item">
                    <span class="credential-label">Login URL:</span>
                    <span class="credential-value"><a href="${loginUrl}" style="color: #667eea; text-decoration: none;">${loginUrl}</a></span>
                </div>
            </div>
            
            <div class="warning">
                <h3>⚠️ Important Security Notice</h3>
                <p>For security reasons, you <strong>MUST</strong> change your password on first login. The system will automatically prompt you to set a new, secure password.</p>
            </div>
            
            <div class="steps">
                <h3>🚀 Quick Start Guide</h3>
                <ol>
                    <li>Click the <span class="highlight">Login Button</span> below or go to <a href="${loginUrl}">${loginUrl}</a></li>
                    <li>Enter your email: <strong>${email}</strong></li>
                    <li>Enter your password: <strong>${password}</strong></li>
                    <li>You'll be prompted to change your password - choose a strong, secure password</li>
                    <li>Start managing your XianFeast platform!</li>
                </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" class="button">🚀 Login to XianFeast Dashboard</a>
            </div>
            
            <div class="capabilities">
                <h3>👑 Super Admin Capabilities</h3>
                <ul>
                    <li>✅ Create and manage businesses</li>
                    <li>✅ Manage user accounts and roles</li>
                    <li>✅ View system analytics and reports</li>
                    <li>✅ Configure webhooks and integrations</li>
                    <li>✅ Access all platform features</li>
                    <li>✅ Reset user passwords and unlock accounts</li>
                    <li>✅ Send invitation emails to new users</li>
                </ul>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #2196f3;">
                <h3 style="margin: 0 0 10px 0; color: #1565c0;">💡 Pro Tip</h3>
                <p style="margin: 0; color: #1565c0;">After logging in, explore the Admin Dashboard to familiarize yourself with all the powerful management tools available to you.</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>XianFeast Platform</strong> - Your complete restaurant management solution</p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you didn't expect this email, please contact your system administrator immediately.</p>
        </div>
    </div>
</body>
</html>
  `
  
  try {
    await sendEmail({
      to: email,
      subject: '🎉 XianFeast Super Admin Login Credentials - Ready to Use!',
      html: emailContent
    })
    
    console.log('✅ Super admin email sent successfully!')
    console.log('\n📧 Email Details:')
    console.log(`   • To: ${email}`)
    console.log(`   • Subject: XianFeast Super Admin Login Credentials - Ready to Use!`)
    console.log(`   • Login URL: ${loginUrl}`)
    console.log(`   • Password: ${password}`)
    
    console.log('\n🔧 Next Steps:')
    console.log('   1. Check your email inbox')
    console.log('   2. Click the login button in the email')
    console.log('   3. Enter your credentials')
    console.log('   4. Change your password when prompted')
    console.log('   5. Start managing your XianFeast platform!')
    
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  sendSuperAdminEmail()
}
