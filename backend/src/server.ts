import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { initSocket } from './socket/socketHandler';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth-routes';
import companyRoutes from './routes/company-routes';
import marketplaceRoutes from './routes/marketplace-routes';
import orderRoutes from './routes/order-routes';
import notificationRoutes from './routes/notification-routes';
import settingsRoutes from './routes/settings-routes';
import adminRoutes from './routes/admin-routes';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Socket.io initialization
const io = new SocketIOServer(server, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

initSocket(io);

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    project: 'ReCarbo API',
    tagline: 'Capture. Connect. Reuse.',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 ReCarbo Backend Server running on port ${PORT}`);
  logger.info(`🌿 Climate-tech B2B Marketplace API ready at http://localhost:${PORT}/api/health`);
});

export { app, server, io };
