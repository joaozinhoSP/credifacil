import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from './generated/client.js';
import authRoutes from './routes/auth.js';
import visitRoutes from './routes/visits.js';
import routeRoutes from './routes/routes.js';
import checkoutRoutes from './routes/checkout.js';
import webhookRoutes from './routes/webhook.js';
import profileRoutes from './routes/profile.js';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api', checkoutRoutes);
app.use('/api/webhook', webhookRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { prisma };
