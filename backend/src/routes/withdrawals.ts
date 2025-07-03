import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import { WithdrawalService } from '../services/withdrawalService';
import { WithdrawalReason } from '../../../shared/types';

const router = Router();
const withdrawalService = new WithdrawalService();

// Obtener todos los retiros con filtros
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, reason } = req.query;
    const filters = {
      startDate: startDate as string,
      endDate: endDate as string,
      reason: reason as WithdrawalReason,
      userId: req.user!.uid
    };

    const withdrawals = await withdrawalService.getWithdrawals(filters);
    
    return res.json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    console.error('Error obteniendo retiros:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo retiros'
    });
  }
});

// Crear nuevo retiro
router.post('/', [
  body('amount').isNumeric().withMessage('Monto debe ser numérico').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('reason').notEmpty().withMessage('Motivo es requerido'),
  body('description').optional().isString()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const withdrawalData = {
      ...req.body,
      userId: req.user!.uid
    };

    const withdrawal = await withdrawalService.createWithdrawal(withdrawalData);
    
    return res.status(201).json({
      success: true,
      data: withdrawal
    });
  } catch (error) {
    console.error('Error creando retiro:', error);
    return res.status(500).json({
      success: false,
      error: 'Error creando retiro'
    });
  }
});

// Obtener retiro por ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const withdrawal = await withdrawalService.getWithdrawalById(id, req.user!.uid);
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        error: 'Retiro no encontrado'
      });
    }

    return res.json({
      success: true,
      data: withdrawal
    });
  } catch (error) {
    console.error('Error obteniendo retiro:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo retiro'
    });
  }
});

// Actualizar retiro
router.put('/:id', [
  body('amount').optional().isNumeric().withMessage('Monto debe ser numérico').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('reason').optional().notEmpty().withMessage('Motivo no puede estar vacío'),
  body('description').optional().isString()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const withdrawal = await withdrawalService.updateWithdrawal(id, req.body, req.user!.uid);
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        error: 'Retiro no encontrado'
      });
    }

    return res.json({
      success: true,
      data: withdrawal
    });
  } catch (error) {
    console.error('Error actualizando retiro:', error);
    return res.status(500).json({
      success: false,
      error: 'Error actualizando retiro'
    });
  }
});

// Eliminar retiro
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await withdrawalService.deleteWithdrawal(id, req.user!.uid);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Retiro no encontrado'
      });
    }

    return res.json({
      success: true,
      message: 'Retiro eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando retiro:', error);
    return res.status(500).json({
      success: false,
      error: 'Error eliminando retiro'
    });
  }
});

export default router;
