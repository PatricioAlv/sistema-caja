import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import { SalesService } from '../services/salesService';
import { PaymentMethod } from '../../../shared/types';

const router = Router();
const salesService = new SalesService();

// Obtener todas las ventas con filtros
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, paymentMethod } = req.query;
    const filters = {
      startDate: startDate as string,
      endDate: endDate as string,
      paymentMethod: paymentMethod as PaymentMethod,
      userId: req.user!.uid
    };

    const sales = await salesService.getSales(filters);
    
    return res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo ventas'
    });
  }
});

// Crear nueva venta
router.post('/', [
  body('description').notEmpty().withMessage('Descripción es requerida'),
  body('amount').isNumeric().withMessage('Monto debe ser numérico'),
  body('paymentMethod').notEmpty().withMessage('Medio de pago es requerido')
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

    const saleData = {
      ...req.body,
      userId: req.user!.uid
    };

    console.log('Datos recibidos en backend:', JSON.stringify(saleData, null, 2));
    const sale = await salesService.createSale(saleData);
    
    return res.status(201).json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Error creando venta:', error);
    return res.status(500).json({
      success: false,
      error: 'Error creando venta'
    });
  }
});

// Obtener venta por ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const sale = await salesService.getSaleById(id, req.user!.uid);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada'
      });
    }

    return res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Error obteniendo venta:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo venta'
    });
  }
});

// Actualizar venta
router.put('/:id', [
  body('description').optional().notEmpty(),
  body('amount').optional().isNumeric(),
  body('paymentMethod').optional().notEmpty()
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
    const sale = await salesService.updateSale(id, req.body, req.user!.uid);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada'
      });
    }

    return res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Error actualizando venta:', error);
    return res.status(500).json({
      success: false,
      error: 'Error actualizando venta'
    });
  }
});

// Eliminar venta
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await salesService.deleteSale(id, req.user!.uid);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada'
      });
    }

    return res.json({
      success: true,
      message: 'Venta eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando venta:', error);
    return res.status(500).json({
      success: false,
      error: 'Error eliminando venta'
    });
  }
});

export default router;
