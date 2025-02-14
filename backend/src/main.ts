import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import passport from 'passport';
import mongoose from 'mongoose';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import './utils/google.auth';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 8000;
const MONGO_URI = process.env.MONGO_URI ?? '';

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.JWT_SECRET ?? '',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch((error) => console.error('❌ MongoDB connection failed:', error));

// routes
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send({ message: 'Server is running 🚀' });
});

// start the server
app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
