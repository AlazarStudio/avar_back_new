import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import https from 'https';

import { errorHandler, notFound } from './app/middleware/error.middleware.js';
import { prisma } from './app/prisma.js';

import authRoutes from './app/auth/auth.routes.js';
import userRoutes from './app/user/user.routes.js';

import beratungRoutes from './app/routes/beratung.js';
import projectRoutes from './app/routes/project.js';
import categoryRoutes from './app/routes/category.js';
import feedbackRoutes from './app/routes/feedback.js';
import uploadRoutes from './app/routes/uploads.js';
import handwerkRoutes from './app/routes/handwerk.js';
import reinigungRoutes from './app/routes/reinigung.js';

dotenv.config();

const app = express();

const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/<folder>/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/<folder>/cert.pem'),
  ca: fs.readFileSync('/etc/letsencrypt/live/<folder>/chain.pem'),
};

const httpsServer = https.createServer(sslOptions, app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());

// 👇 добавь после cors()
app.use((req, res, next) => {
  res.header('Access-Control-Expose-Headers', 'Content-Range');
  next();
});
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/beratungs', beratungRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/handwerks', handwerkRoutes);
app.use('/api/reinigungs', reinigungRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/upload', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = 443;

// app.listen(PORT, () =>
//   console.log(`🚀 Server running in ${process.env.NODE_ENV} on port ${PORT}`)
// );

httpsServer.listen(PORT, () => {
  console.log('Server is now running on https 443');
});
