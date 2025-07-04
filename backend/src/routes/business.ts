import { Router } from 'express';
import { businessService } from '../services/businessService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Obtener configuración del negocio
router.get('/', authMiddleware, (req, res) => {
  businessService.getBusinessConfigHandler(req, res);
});

// Crear configuración del negocio
router.post('/', authMiddleware, (req, res) => {
  businessService.createBusinessConfigHandler(req, res);
});

// Actualizar configuración del negocio
router.put('/', authMiddleware, (req, res) => {
  businessService.updateBusinessConfigHandler(req, res);
});

export default router;
