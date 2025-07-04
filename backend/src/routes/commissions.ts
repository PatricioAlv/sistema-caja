import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { CommissionService } from '../services/commissionService';
import { CommissionConfig } from '../../../shared/types';
import { Response } from 'express';

const router = Router();

// Obtener configuraciones de comisiones del usuario
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario no autenticado' 
      });
    }

    const commissions = await CommissionService.getCommissions(userId);
    
    return res.json({
      success: true,
      data: commissions
    });
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener configuraciones organizadas por tipo
router.get('/organized', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario no autenticado' 
      });
    }

    const organized = await CommissionService.getOrganizedCommissions(userId);
    
    return res.json({
      success: true,
      data: organized
    });
  } catch (error) {
    console.error('Error obteniendo configuraciones organizadas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Crear configuraciones predeterminadas
router.post('/default', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario no autenticado' 
      });
    }

    const commissions = await CommissionService.createDefaultCommissions(userId);
    
    return res.status(201).json({
      success: true,
      data: commissions
    });
  } catch (error) {
    console.error('Error creando configuraciones predeterminadas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Actualizar una configuración de comisión
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario no autenticado' 
      });
    }

    const { id } = req.params;
    const updates: Partial<CommissionConfig> = req.body;

    // Validar que solo se actualicen campos permitidos
    const allowedFields = ['percentage', 'fixedAmount', 'isActive'];
    const filteredUpdates: any = {};
    
    for (const field of allowedFields) {
      if (field in updates) {
        filteredUpdates[field] = updates[field as keyof CommissionConfig];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay campos válidos para actualizar'
      });
    }

    const updatedCommission = await CommissionService.updateCommission(id, filteredUpdates, userId);
    
    return res.json({
      success: true,
      data: updatedCommission
    });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
});

// Calcular comisión para una venta
router.post('/calculate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario no autenticado' 
      });
    }

    const { paymentMethod, amount, cardBrand, installments } = req.body;

    if (!paymentMethod || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Medio de pago y monto son requeridos'
      });
    }

    if (paymentMethod === 'tarjeta_credito' && (!cardBrand || !installments)) {
      return res.status(400).json({
        success: false,
        error: 'Para tarjetas de crédito se requiere marca y cantidad de cuotas'
      });
    }

    const commission = await CommissionService.calculateCommission(
      userId,
      paymentMethod,
      amount,
      cardBrand,
      installments
    );
    
    return res.json({
      success: true,
      data: {
        commission,
        netAmount: amount - commission
      }
    });
  } catch (error) {
    console.error('Error calculando comisión:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
