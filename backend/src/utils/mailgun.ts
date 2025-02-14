import nodemailer from 'nodemailer';
import mg from 'nodemailer-mailgun-transport';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

console.log('MAILGUN_API_KEY:', process.env.MAILGUN_API_KEY);
console.log('MAILGUN_DOMAIN:', process.env.MAILGUN_DOMAIN);
console.log('MAILGUN_FROM_EMAIL:', process.env.MAILGUN_FROM_EMAIL);

if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
  throw new Error('Missing MAILGUN_API_KEY or MAILGUN_DOMAIN in .env');
}

const mailgunAuth = {
  auth: {
    api_key: process.env.MAILGUN_API_KEY as string,
    domain: process.env.MAILGUN_DOMAIN as string,
  },
};

const transporter = nodemailer.createTransport(mg(mailgunAuth));

export const sendMail = async (to: string, subject: string, text: string) => {
  const mailOptions = {
    from: process.env.MAILGUN_FROM_EMAIL,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email.');
  }
};
