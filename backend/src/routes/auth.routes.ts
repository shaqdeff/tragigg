import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import passport from 'passport';
import User from '../models/user.model';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateVerificationCode,
} from '../utils/auth';
import authMiddleWare from '../middleware/auth.middleware';
import { sendVerificationEmail } from '../services/email.service';

const router: express.Router = express.Router();

// register/sign up
router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/[0-9]/)
      .matches(/[!@#$%^&*]/)
      .withMessage('Password must be 8+ chars with a number & symbol'),
  ],
  async (req: any, res: any) => {
    try {
      const { firstName, lastName, email, phone, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashedPassword = await hashPassword(password.trim());
      const verificationCode = generateVerificationCode();
      const verificationCodeExpires = new Date(Date.now() + 3600000);

      const newUser = new User({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        isVerified: false,
        verificationCode,
        verificationCodeExpires,
      });

      await newUser.save();

      const token = generateToken(newUser.id, newUser.email);

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 604800000,
      });

      // Send verification email with the code
      await sendVerificationEmail(email, verificationCode, firstName);

      res.status(201).json({
        message: 'User created successfully. Please verify your email.',
        requiresVerification: true,
        redirectUrl: `/verify-email?email=${newUser.email}`,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// login/sign in
router.post('/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    // trim the password
    const trimmedPassword = password.trim();

    // find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Email not registered' });
    }

    // compare passwords
    const isMatch = await comparePassword(trimmedPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // generate JWT token
    const token = generateToken(user.id, user.email);

    // store token in HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 604800000, // 7 days
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
      },
      redirectUrl: process.env.FRONTEND_URL,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// google auth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/register`,
  }),
  async (req: any, res) => {
    try {
      const token = generateToken(req.user.id, req.user.email);

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 604800000,
        path: '/',
      });

      if (!req.user.isVerified) {
        // For Google auth, generate verification code if needed
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + 3600000);

        req.user.verificationCode = verificationCode;
        req.user.verificationCodeExpires = verificationCodeExpires;
        await req.user.save();

        await sendVerificationEmail(
          req.user.email,
          verificationCode,
          req.user.firstName
        );

        return res.redirect(
          `${process.env.FRONTEND_URL}/verify-email?email=${req.user.email}&isVerified=${req.user.isVerified}`
        );
      }

      res.redirect(process.env.FRONTEND_URL || '');
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('/login?error=auth_failed');
    }
  }
);

// verify email
router.post('/verify', async (req: any, res: any) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < new Date()
    ) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    user.isVerified = true;
    user.verificationCode = '';
    user.verificationCodeExpires = null;
    await user.save();

    res.status(200).json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        isVerified: true,
      },
      redirectUrl: process.env.FRONTEND_URL,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Logged out successfully' });
});

// protected route
router.get('/profile', authMiddleWare, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
export default router;
