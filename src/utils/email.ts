import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// ==============================
// INIT RESEND
// ==============================
const resend = new Resend(process.env.RESEND_API_KEY);

// ==============================
// GENERIC EMAIL SENDER
// ==============================
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<void> => {
  try {
    console.log("📧 GreenLink email sending to:", to);

    const response = await resend.emails.send({
      from: "GreenLink <onboarding@resend.dev>",
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent successfully:", response);
  } catch (error) {
    console.error("❌ GreenLink email error:", error);
    throw error;
  }
};

// ==============================
// EMAIL VERIFICATION TEMPLATE
// ==============================
export const generateVerificationEmail = (name: string, link: string) => {
  const subject = "✅ Verify your GreenLink account";

  const text = `
Hi ${name},

Welcome to GreenLink 🌱

Please verify your email by clicking the link below:

${link}

This link expires in 3 hours.

If you didn’t create this account, you can ignore this email.
  `;

  const html = `
  <div style="font-family: Arial, sans-serif; background:#0f0f0f; color:#ffffff; padding:30px; border-radius:10px;">

    <h2 style="color:#00cc66;">
      Welcome to GreenLink 🌱
    </h2>

    <p style="font-size:15px; line-height:1.6;">
      Hi <strong>${name}</strong>,<br/><br/>
      Please verify your email address to activate your GreenLink account.
    </p>

    <a href="${link}"
      style="
        display:inline-block;
        margin:20px 0;
        padding:12px 24px;
        background:#00cc66;
        color:#000;
        font-weight:bold;
        text-decoration:none;
        border-radius:6px;
      ">
      Verify Email Address
    </a>

    <p style="font-size:12px; color:#aaa;">
      This link will expire in <strong>3 hours</strong>.
    </p>

    <p style="font-size:12px; color:#777;">
      If you didn’t create this account, you can safely ignore this email.
    </p>

    <hr style="border:0; border-top:1px solid #222; margin:20px 0;" />

    <p style="font-size:11px; color:#555;">
      GreenLink Team
    </p>

  </div>
  `;

  return { subject, text, html };
};

// ==============================
// PASSWORD RESET TEMPLATE
// ==============================
export const generateResetPasswordEmail = (name: string, link: string) => {
  const subject = "🔐 Reset your GreenLink password";

  const text = `
Hi ${name},

A password reset was requested for your GreenLink account.

Reset it here:
${link}

This link expires in 1 hour.

If you didn’t request this, ignore this email.
  `;

  const html = `
  <div style="font-family: Arial, sans-serif; background:#000; color:#fff; padding:30px; border-radius:10px;">

    <h2 style="color:#00e676;">Reset Your Password</h2>

    <p>If you requested a password reset, click below:</p>

    <a href="${link}"
      style="
        display:inline-block;
        padding:12px 20px;
        background:#00e676;
        color:#000;
        font-weight:bold;
        text-decoration:none;
        border-radius:6px;
        margin:20px 0;
      ">
      Reset Password
    </a>

    <p style="color:#aaa; font-size:12px;">
      This link expires in 1 hour.
    </p>

    <p style="color:#666; font-size:12px;">
      If you didn’t request this, ignore this email.
    </p>

  </div>
  `;

  return { subject, text, html };
};