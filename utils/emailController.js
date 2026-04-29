const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
});

exports.sendEmail = (link, email) => {
    const mailOptions = {
        from: {
            name: "OneLink",
            address: process.env.EMAIL,
        },
        to: email,
        subject: "Reset Your Password - OneLink",
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background-color: #f8f9fa;
                    padding: 20px;
                    line-height: 1.6;
                }

                .email-wrapper {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .email-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 30px;
                    text-align: center;
                }

                .logo {
                    font-size: 32px;
                    font-weight: 800;
                    color: #ffffff;
                    margin-bottom: 10px;
                    letter-spacing: -0.5px;
                }

                .header-subtitle {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 14px;
                }

                .email-body {
                    padding: 40px 30px;
                    color: #333333;
                }

                .greeting {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 20px;
                    color: #1a1a1a;
                }

                .message {
                    font-size: 15px;
                    color: #555555;
                    margin-bottom: 30px;
                }

                .button-container {
                    text-align: center;
                    margin: 35px 0;
                }

                .reset-button {
                    display: inline-block;
                    padding: 16px 40px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #ffffff !important;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    transition: transform 0.2s;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }

                .reset-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
                }

                .info-box {
                    background-color: #f8f9fa;
                    border-left: 4px solid #667eea;
                    padding: 15px 20px;
                    margin: 25px 0;
                    border-radius: 4px;
                }

                .info-box p {
                    margin: 0;
                    font-size: 14px;
                    color: #666666;
                }

                .warning {
                    font-size: 14px;
                    color: #666666;
                    margin-top: 25px;
                }

                .email-footer {
                    background-color: #f8f9fa;
                    padding: 30px;
                    text-align: center;
                    border-top: 1px solid #e9ecef;
                }

                .footer-text {
                    font-size: 13px;
                    color: #888888;
                    margin-bottom: 10px;
                }

                .footer-brand {
                    font-weight: 600;
                    color: #667eea;
                }

                @media only screen and (max-width: 600px) {
                    .email-body {
                        padding: 30px 20px;
                    }
                    
                    .email-header {
                        padding: 30px 20px;
                    }
                    
                    .reset-button {
                        padding: 14px 30px;
                        font-size: 15px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <!-- Header -->
                <div class="email-header">
                    <img src="https://onelinkprofile.s3.ap-south-1.amazonaws.com/assets/nelink-logo.png" alt="NELINK" width="100" height="100" style="display: block; margin: 0 auto 15px; border-radius: 10px;" />
                    <div class="header-subtitle">Your Personal Link Hub</div>
                </div>

                <!-- Body -->
                <div class="email-body">
                    <div class="greeting">Hello!</div>
                    
                    <div class="message">
                        We received a request to reset your password for your OneLink account. Click the button below to create a new password.
                    </div>

                    <div class="button-container">
                        <a href="${link}" class="reset-button">Reset Password</a>
                    </div>

                    <div class="info-box">
                        <p><strong>⏱️ This link will expire in 15 minutes</strong></p>
                    </div>

                    <div class="warning">
                        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                    </div>
                </div>

                <!-- Footer -->
                <div class="email-footer">
                    <div class="footer-text">
                        This email was sent by <span class="footer-brand">OneLink</span>
                    </div>
                    <div class="footer-text">
                        © ${new Date().getFullYear()} OneLink. All rights reserved.
                    </div>
                </div>
            </div>
        </body>
        </html>
        `,
    };

    try {
        const response = transporter.sendMail(mailOptions);
        console.log(response);
    }
    catch (error) {
        console.error(error);
    }
};

exports.sendVerificationEmail = (link, email) => {
    const mailOptions = {
        from: {
            name: "OneLink",
            address: process.env.EMAIL,
        },
        to: email,
        subject: "Verify Your Email - OneLink",
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background-color: #f8f9fa;
                    padding: 20px;
                    line-height: 1.6;
                }

                .email-wrapper {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .email-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 30px;
                    text-align: center;
                }

                .logo {
                    font-size: 32px;
                    font-weight: 800;
                    color: #ffffff;
                    margin-bottom: 10px;
                    letter-spacing: -0.5px;
                }

                .header-subtitle {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 14px;
                }

                .email-body {
                    padding: 40px 30px;
                    color: #333333;
                }

                .greeting {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 20px;
                    color: #1a1a1a;
                }

                .message {
                    font-size: 15px;
                    color: #555555;
                    margin-bottom: 30px;
                }

                .button-container {
                    text-align: center;
                    margin: 35px 0;
                }

                .verify-button {
                    display: inline-block;
                    padding: 16px 40px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #ffffff !important;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    transition: transform 0.2s;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }

                .verify-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
                }

                .info-box {
                    background-color: #f8f9fa;
                    border-left: 4px solid #667eea;
                    padding: 15px 20px;
                    margin: 25px 0;
                    border-radius: 4px;
                }

                .info-box p {
                    margin: 0;
                    font-size: 14px;
                    color: #666666;
                }

                .features {
                    margin: 30px 0;
                    padding: 20px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                }

                .features-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin-bottom: 15px;
                }

                .feature-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 10px;
                    font-size: 14px;
                    color: #555555;
                }

                .feature-icon {
                    margin-right: 10px;
                    font-size: 18px;
                }

                .warning {
                    font-size: 14px;
                    color: #666666;
                    margin-top: 25px;
                }

                .email-footer {
                    background-color: #f8f9fa;
                    padding: 30px;
                    text-align: center;
                    border-top: 1px solid #e9ecef;
                }

                .footer-text {
                    font-size: 13px;
                    color: #888888;
                    margin-bottom: 10px;
                }

                .footer-brand {
                    font-weight: 600;
                    color: #667eea;
                }

                @media only screen and (max-width: 600px) {
                    .email-body {
                        padding: 30px 20px;
                    }
                    
                    .email-header {
                        padding: 30px 20px;
                    }
                    
                    .verify-button {
                        padding: 14px 30px;
                        font-size: 15px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <!-- Header -->
                <div class="email-header">
                    <img src="https://onelinkprofile.s3.ap-south-1.amazonaws.com/assets/nelink-logo.png" alt="NELINK" width="100" height="100" style="display: block; margin: 0 auto 15px; border-radius: 10px;" />
                    <div class="header-subtitle">Your Personal Link Hub</div>
                </div>

                <!-- Body -->
                <div class="email-body">
                    <div class="greeting">Welcome to OneLink! 🎉</div>
                    
                    <div class="message">
                        Thank you for signing up! We're excited to have you on board. To get started, please verify your email address by clicking the button below.
                    </div>

                    <div class="button-container">
                        <a href="${link}" class="verify-button">Verify Email Address</a>
                    </div>

                    <div class="info-box">
                        <p><strong>⏱️ This verification link will expire in 15 minutes</strong></p>
                    </div>

                    <div class="features">
                        <div class="features-title">What you can do with OneLink:</div>
                        <div class="feature-item">
                            <span class="feature-icon">🔗</span>
                            <span>Create unlimited custom links</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">🎨</span>
                            <span>Choose from 18+ beautiful themes</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">📊</span>
                            <span>Track clicks and analytics</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">📱</span>
                            <span>Mobile-optimized profile pages</span>
                        </div>
                    </div>

                    <div class="warning">
                        If you didn't create an account with OneLink, you can safely ignore this email.
                    </div>
                </div>

                <!-- Footer -->
                <div class="email-footer">
                    <div class="footer-text">
                        This email was sent by <span class="footer-brand">OneLink</span>
                    </div>
                    <div class="footer-text">
                        © ${new Date().getFullYear()} OneLink. All rights reserved.
                    </div>
                </div>
            </div>
        </body>
        </html>
        `,
    };

    try {
        const response = transporter.sendMail(mailOptions);
        console.log(response);
    }
    catch (error) {
        console.error(error);
    }
};