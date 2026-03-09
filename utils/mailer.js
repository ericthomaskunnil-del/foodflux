const nodemailer = require('nodemailer');

// ─── Email Transporter Setup ──────────────────────────────────────────────
// Uses Gmail SMTP. Set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file.
// To generate an App Password: https://myaccount.google.com/apppasswords
// If no Gmail credentials are set, falls back to Ethereal (test emails).

let transporter;

if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });
    console.log('📧 Email configured with Gmail SMTP');
} else {
    // Fallback: Ethereal (test service, emails are NOT actually delivered)
    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'ethereal.user@ethereal.email',
            pass: 'ethereal_password'
        }
    });
    console.log('📧 Email configured with Ethereal (test mode — no real emails sent)');
}

const FROM_ADDRESS = process.env.GMAIL_USER
    ? `"Food Flux" <${process.env.GMAIL_USER}>`
    : '"Food Flux" <noreply@foodflux.org>';

// ─── Shared HTML Layout ──────────────────────────────────────────────────
function wrapInLayout(bodyContent) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a1a; color: #f0f0f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, rgba(108,92,231,0.3), rgba(168,85,247,0.2)); border-radius: 16px 16px 0 0; border: 1px solid rgba(255,255,255,0.08);">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800;">
                    <span style="font-size: 32px;">🍽️</span>
                    <span style="background: linear-gradient(135deg, #6c5ce7, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Food Flux</span>
                </h1>
                <p style="margin: 8px 0 0; color: #a0a0b8; font-size: 14px;">Reducing food waste, one meal at a time</p>
            </div>

            <!-- Body -->
            <div style="background: rgba(17,17,40,0.95); padding: 36px 30px; border-left: 1px solid rgba(255,255,255,0.08); border-right: 1px solid rgba(255,255,255,0.08);">
                ${bodyContent}
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 24px 20px; background: rgba(17,17,40,0.8); border-radius: 0 0 16px 16px; border: 1px solid rgba(255,255,255,0.08); border-top: none;">
                <p style="margin: 0 0 8px; color: #6b6b80; font-size: 12px;">This is an automated message from Food Flux.</p>
                <p style="margin: 0; color: #6b6b80; font-size: 12px;">© ${new Date().getFullYear()} Food Flux — Localised Food Surplus Distribution System</p>
            </div>
        </div>
    </body>
    </html>`;
}

// ─── Welcome Email (Registration) ────────────────────────────────────────
exports.sendWelcomeEmail = async (user) => {
    try {
        const roleEmoji = user.role === 'donor' ? '🍱' : '🚚';
        const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);

        const bodyContent = `
            <h2 style="margin: 0 0 16px; font-size: 22px; color: #f0f0f5;">Welcome to Food Flux, ${user.name}! 🎉</h2>
            <p style="color: #a0a0b8; line-height: 1.7; margin: 0 0 20px;">
                Your account has been successfully created. You're now part of a community dedicated to reducing food waste and helping those in need.
            </p>
            
            <div style="background: rgba(108,92,231,0.1); border: 1px solid rgba(108,92,231,0.2); border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin: 0 0 14px; font-size: 16px; color: #a855f7;">Your Account Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; color: #6b6b80; font-size: 14px; width: 100px;">Name</td>
                        <td style="padding: 6px 0; color: #f0f0f5; font-size: 14px; font-weight: 600;">${user.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #6b6b80; font-size: 14px;">Email</td>
                        <td style="padding: 6px 0; color: #f0f0f5; font-size: 14px;">${user.email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #6b6b80; font-size: 14px;">Role</td>
                        <td style="padding: 6px 0; color: #f0f0f5; font-size: 14px;">${roleEmoji} ${roleLabel}</td>
                    </tr>
                </table>
            </div>

            <p style="color: #a0a0b8; line-height: 1.7; margin: 0 0 24px;">
                ${user.role === 'donor'
                ? 'As a <strong style="color: #a855f7;">Donor</strong>, you can now post surplus food listings for volunteers to pick up. Start by adding your first listing from your dashboard!'
                : 'As a <strong style="color: #3b82f6;">Volunteer</strong>, you can now browse available food listings and accept pickups. Check the live map on your dashboard to find food near you!'
            }
            </p>

            <div style="text-align: center; margin: 28px 0 0;">
                <a href="http://localhost:${process.env.PORT || 3000}/${user.role}" 
                   style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6c5ce7, #a855f7); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                    Go to Your Dashboard →
                </a>
            </div>
        `;

        await transporter.sendMail({
            from: FROM_ADDRESS,
            to: user.email,
            subject: `Welcome to Food Flux, ${user.name}! 🎉`,
            html: wrapInLayout(bodyContent)
        });

        console.log('📧 Welcome email sent to:', user.email);
    } catch (err) {
        console.error('Error sending welcome email:', err.message);
    }
};

// ─── Login Notification Email ────────────────────────────────────────────
exports.sendLoginNotification = async (user) => {
    try {
        const now = new Date();
        const loginTime = now.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'full',
            timeStyle: 'short'
        });

        const bodyContent = `
            <h2 style="margin: 0 0 16px; font-size: 22px; color: #f0f0f5;">Login Detected 🔐</h2>
            <p style="color: #a0a0b8; line-height: 1.7; margin: 0 0 20px;">
                Hello <strong style="color: #f0f0f5;">${user.name}</strong>, we noticed a new sign-in to your Food Flux account.
            </p>
            
            <div style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin: 0 0 14px; font-size: 16px; color: #10b981;">Login Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; color: #6b6b80; font-size: 14px; width: 100px;">Account</td>
                        <td style="padding: 6px 0; color: #f0f0f5; font-size: 14px;">${user.email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #6b6b80; font-size: 14px;">Time</td>
                        <td style="padding: 6px 0; color: #f0f0f5; font-size: 14px;">${loginTime}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #6b6b80; font-size: 14px;">Role</td>
                        <td style="padding: 6px 0; color: #f0f0f5; font-size: 14px;">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                    </tr>
                </table>
            </div>

            <p style="color: #a0a0b8; line-height: 1.7; margin: 0 0 8px;">
                If this was you, no further action is needed. If you didn't sign in, please change your password immediately.
            </p>
        `;

        await transporter.sendMail({
            from: FROM_ADDRESS,
            to: user.email,
            subject: `New login to your Food Flux account`,
            html: wrapInLayout(bodyContent)
        });

        console.log('📧 Login notification sent to:', user.email);
    } catch (err) {
        console.error('Error sending login notification:', err.message);
    }
};

// ─── Automated Match Email ───────────────────────────────────────────────
exports.sendMatchEmail = async (volunteer, listing) => {
    try {
        const bodyContent = `
            <h2 style="margin: 0 0 16px; font-size: 22px; color: #f0f0f5;">New Food Available Nearby! 🔔</h2>
            <p style="color: #a0a0b8; line-height: 1.7; margin: 0 0 20px;">
                Hello <strong style="color: #f0f0f5;">${volunteer.name}</strong>, a new food surplus listing has just been added that you might be interested in.
            </p>
            
            <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin: 0 0 14px; font-size: 16px; color: #f59e0b;">Listing Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; color: #6b6b80; font-size: 14px; width: 120px;">Food</td>
                        <td style="padding: 6px 0; color: #f0f0f5; font-size: 14px; font-weight: 600;">${listing.foodName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #6b6b80; font-size: 14px;">Quantity</td>
                        <td style="padding: 6px 0; color: #f0f0f5; font-size: 14px;">${listing.quantity}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #6b6b80; font-size: 14px;">Location</td>
                        <td style="padding: 6px 0; color: #f0f0f5; font-size: 14px;">${listing.location}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #6b6b80; font-size: 14px;">Pickup Time</td>
                        <td style="padding: 6px 0; color: #f0f0f5; font-size: 14px;">${listing.pickupTime}</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; margin: 28px 0 0;">
                <a href="http://localhost:${process.env.PORT || 3000}/volunteer"
                   style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6c5ce7, #a855f7); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                    Claim This Pickup →
                </a>
            </div>
        `;

        await transporter.sendMail({
            from: FROM_ADDRESS,
            to: volunteer.email,
            subject: `🔔 New Food Surplus: ${listing.foodName}`,
            html: wrapInLayout(bodyContent)
        });

        console.log('📧 Match email sent to:', volunteer.email);
    } catch (err) {
        console.error('Error sending match email:', err.message);
    }
};
