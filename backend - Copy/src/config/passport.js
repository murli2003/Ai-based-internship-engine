import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID     || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL:  process.env.GOOGLE_CALLBACK_URL  || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google'), null);

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            email,
            password:  undefined,
            googleId:  profile.id,
            role:      'student',
            fullName:  profile.displayName || '',
            isActive:  true,
          });
        } else if (!user.googleId) {
          user.googleId = profile.id;
          await user.save({ validateBeforeSave: false });
        }

        const populatedUser = await User.findById(user._id).select('-password');
        return done(null, populatedUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
