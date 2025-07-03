import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Cargar variables de entorno PRIMERO
dotenv.config();

import { initializeFirebase } from './config/firebase';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import salesRoutes from './routes/sales';
import summaryRoutes from './routes/summary';
import withdrawalRoutes from './routes/withdrawals';

const app = express();
const PORT = process.env.PORT || 3001;

// Firebase ya se inicializa automáticamente al importar el módulo

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware de logging
app.use(morgan('combined'));

// Middleware para JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas públicas
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware de autenticación para rutas protegidas
app.use('/api', authMiddleware);

// Rutas de la API
app.use('/api/sales', salesRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/withdrawals', withdrawalRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
});
