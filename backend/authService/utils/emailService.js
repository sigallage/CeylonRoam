const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    // Check if email credentials are configured
    const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
    
    if (!hasEmailConfig) {
      // Development mode - just log the OTP
      console.log('\n========================================');
      console.log('📧 DEVELOPMENT MODE - OTP EMAIL');
      console.log('========================================');
      console.log('To:', email);
      console.log('OTP:', otp);
      console.log('Valid for: 10 minutes');
      console.log('========================================\n');
      
      return { 
        success: true, 
        mode: 'development',
        message: 'OTP logged to console (email not configured)' 
      };
    }
    
    // Production mode - send actual email
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'CeylonRoam - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #000; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #FFD700; margin: 0;">Ceylon<span style="color: #FFA500;">Roam</span></h1>
          </div>
          
          <div style="background-color: #fff; padding: 40px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              We received a request to reset your password. Use the OTP code below to proceed:
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h1 style="color: #000; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              This OTP is valid for <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2026 CeylonRoam. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', info.messageId);
    return { success: true, mode: 'production', messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending OTP email:', {
      message: error?.message,
      code: error?.code,
      responseCode: error?.responseCode,
      response: error?.response,
      command: error?.command,
    });
    throw new Error('Failed to send OTP email');
  }
};

module.exports = { sendOTPEmail };
