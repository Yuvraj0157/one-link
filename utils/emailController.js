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
            name: "OneLink Admin",
            address: process.env.EMAIL,
        },
        to: email,
        subject: "Reset Your Password",
        html: `
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }

                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 5px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                p {
                    margin-bottom: 20px;
                    line-height: 1.6;
                }

                .btn {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #83ed66;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 5px;
                }

                .btn:hover {
                    background-color: #0bdb7e;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <p>Hi,</p>
                <p>We received a request to reset your password. Click the button below to reset your password.</p>
                <p>
                    <a href=${link} class="btn">Reset Password</a>
                </p>
                <p>Above link will expire in 15 minutes.</p>
                <p>If you did not request a password reset, you can safely ignore this email.</p>
                <p>Best regards,<br> OneLink Admin</p>
            </div>
        </body>
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
            name: "OneLink Admin",
            address: process.env.EMAIL,
        },
        to: email,
        subject: "OneLink Account Verification",
        html: `
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }

                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 5px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                p {
                    margin-bottom: 20px;
                    line-height: 1.6;
                }

                .btn {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #83ed66;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 5px;
                }

                .btn:hover {
                    background-color: #0bdb7e;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <p>Hi,</p>
                <p>Click the button below to verify your email address.</p>
                <p>
                    <a href=${link} class="btn">Verify Email</a>
                </p>
                <p>Above link will expire in 15 minutes.</p>
                <p>If you did not create an account, you can safely ignore this email.</p>
                <p>Best regards,<br> OneLink Admin</p>
            </div>
        </body>
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