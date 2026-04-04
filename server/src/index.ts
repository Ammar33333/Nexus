import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import supervisorRoutes from './routes/supervisor';
import notificationRoutes from './routes/notification';
import projectRoutes from './routes/project';
import matchingRoutes from './routes/matching';
import requestRoutes from './routes/request';
import { startCronJobs } from './services/cronService';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/requests', requestRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT}`);
  startCronJobs();
});

export default app;
