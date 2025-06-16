import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // your Gmail address
    pass: process.env.GMAIL_PASS, // your Gmail App Password
  },
});

const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<void> => {
  try {
    const mailOptions = {
      from: `"NYSC Connect" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to: ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

export const generateVerificationEmail = (name: string, link: string) => {
  const subject = "✅ Verify your email address";
  const text = `Hi ${name}, click the link to verify your email: ${link}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #000; color: #fff; padding: 2rem;">
      <h2 style="font-size: 22px; color: #fff;">Verify your email address</h2>
      <p style="font-size: 15px;">To continue setting up your NYSC Connect account, please verify that this is your email address.</p>
      <a href="${link}" style="display: inline-block; margin: 20px 0; padding: 12px 20px; background-color: #00cc33; color: white; text-decoration: none; border-radius: 5px;">Verify email address</a>
      <p style="font-size: 13px; color: #bbb;">This link will expire after 3 hours. If you didn’t request this, please ignore this email.</p>
      <p style="font-size: 13px; color: #bbb;">Need help? Contact our support team.</p>
    </div>
  `;
  return { subject, text, html };
};

export default sendEmail;
