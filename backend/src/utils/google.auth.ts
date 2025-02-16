import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/user.model';
import { generateVerificationCode } from './auth';
import { sendVerificationEmail } from '../services/email.service';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// utils/google.auth.ts
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: '/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          const verificationCode = generateVerificationCode();
          const verificationCodeExpires = new Date(Date.now() + 3600000);

          user = new User({
            firstName: profile.name?.givenName ?? '',
            lastName: profile.name?.familyName ?? '',
            email: profile.emails?.[0].value ?? '',
            googleId: profile.id,
            isVerified: false,
            verificationCode,
            verificationCodeExpires,
          });

          await user.save();

          // Send verification email
          await sendVerificationEmail(
            user.email,
            verificationCode,
            user.firstName
          );
        }

        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user ?? null);
  } catch (error) {
    done(error, null);
  }
});
