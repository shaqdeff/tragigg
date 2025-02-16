import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const templatePath = path.join(
  process.cwd(),
  'backend/dist/src/templates/email-template.handlebars'
);

if (!fs.existsSync(templatePath)) {
  console.error('Template file not found at:', templatePath);
  process.exit(1);
}

const emailTemplateSource = fs.readFileSync(templatePath, 'utf8');
const template = handlebars.compile(emailTemplateSource);

const logoPath = path.join(process.cwd(), 'backend/src/assets/logo.png');
const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });
const logoUrl = `data:image/png;base64,${logoBase64}`;

// function to send verification email
export const sendVerificationEmail = async (
  email: string,
  verificationCode: string,
  userFirstName: string
) => {
  try {
    const htmlToSend = template({
      userFirstName,
      verificationCode,
      logoUrl,
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email',
      html: htmlToSend,
    };

    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};
