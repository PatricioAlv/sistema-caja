import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import { AccountMovementService } from '../services/accountMovementService';

const router = Router();
const movementService = new AccountMovementService();

// Obtener movimientos de cuenta
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, startDate, endDate, type } = req.query;
    
    const filters = {
      customerId: customerId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      type: type as 'sale' | 'payment' | 'adjustment',
      userId: req.user!.uid
    };

    const movements = await movementService.getMovements(filters);
    
    return res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo movimientos'
    });
  }
});

// Obtener cuenta completa de un cliente
router.get('/customer/:customerId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId } = req.params;
    const account = await movementService.getCustomerAccount(customerId, req.user!.uid);
    
    return res.json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error('Error obteniendo cuenta del cliente:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo cuenta del cliente'
    });
  }
});

// Obtener balance de un cliente
router.get('/customer/:customerId/balance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId } = req.params;
    const balance = await movementService.getCustomerBalance(customerId, req.user!.uid);
    
    return res.json({
      success: true,
      data: { balance }
    });
  } catch (error) {
    console.error('Error obteniendo balance:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo balance'
    });
  }
});

// Crear nuevo movimiento
router.post('/', [
  body('customerId').notEmpty().withMessage('ID del cliente es requerido'),
  body('description').notEmpty().withMessage('Descripción es requerida'),
  body('amount').isNumeric().withMessage('Monto debe ser numérico'),
  body('type').isIn(['sale', 'payment', 'adjustment']).withMessage('Tipo de movimiento inválido'),
  body('code').optional({ checkFalsy: true }),
  body('date').optional({ checkFalsy: true }).isISO8601().withMessage('Fecha debe ser válida')
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

    const movementData = {
      ...req.body,
      userId: req.user!.uid
    };

    const movement = await movementService.createMovement(movementData);
    
    return res.status(201).json({
      success: true,
      data: movement
    });
  } catch (error) {
    console.error('Error creando movimiento:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error creando movimiento'
    });
  }
});

// Importar movimientos masivos
router.post('/import', [
  body('customerId').notEmpty().withMessage('ID del cliente es requerido'),
  body('movements').isArray().withMessage('Movimientos debe ser un array'),
  body('movements.*.date').notEmpty().withMessage('Fecha es requerida'),
  body('movements.*.description').notEmpty().withMessage('Descripción es requerida'),
  body('movements.*.amount').isNumeric().withMessage('Monto debe ser numérico'),
  body('movements.*.balance').isNumeric().withMessage('Balance debe ser numérico'),
  body('movements.*.type').isIn(['sale', 'payment', 'adjustment']).withMessage('Tipo inválido')
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

    const { customerId, movements } = req.body;
    
    const importedMovements = await movementService.importMovements(
      customerId,
      movements,
      req.user!.uid
    );
    
    return res.status(201).json({
      success: true,
      data: importedMovements,
      message: `${importedMovements.length} movimientos importados correctamente`
    });
  } catch (error) {
    console.error('Error importando movimientos:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error importando movimientos'
    });
  }
});

// Obtener movimiento por ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const movement = await movementService.getMovementById(id, req.user!.uid);
    
    if (!movement) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento no encontrado'
      });
    }

    return res.json({
      success: true,
      data: movement
    });
  } catch (error) {
    console.error('Error obteniendo movimiento:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo movimiento'
    });
  }
});

// Actualizar movimiento
router.put('/:id', [
  body('description').optional().notEmpty(),
  body('amount').optional().isNumeric(),
  body('code').optional().notEmpty(),
  body('date').optional().isISO8601()
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
    const movement = await movementService.updateMovement(id, req.body, req.user!.uid);
    
    if (!movement) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento no encontrado'
      });
    }

    return res.json({
      success: true,
      data: movement
    });
  } catch (error) {
    console.error('Error actualizando movimiento:', error);
    return res.status(500).json({
      success: false,
      error: 'Error actualizando movimiento'
    });
  }
});

// Eliminar movimiento
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await movementService.deleteMovement(id, req.user!.uid);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento no encontrado'
      });
    }

    return res.json({
      success: true,
      message: 'Movimiento eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando movimiento:', error);
    return res.status(500).json({
      success: false,
      error: 'Error eliminando movimiento'
    });
  }
});

// Importar datos completos desde Excel (cliente + movimientos)
router.post('/import-excel', [
  body('customerName').notEmpty().withMessage('Nombre del cliente es requerido'),
  body('movements').isArray().withMessage('Movimientos debe ser un array'),
  body('movements.*.fecha').notEmpty().withMessage('Fecha es requerida'),
  body('movements.*.descripcion').notEmpty().withMessage('Descripción es requerida'),
  body('movements.*.precio').isNumeric().withMessage('Precio debe ser numérico'),
  body('movements.*.saldo').isNumeric().withMessage('Saldo debe ser numérico')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errores de validación:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { customerName, movements } = req.body;
    
    console.log('📊 Importando datos:', {
      customerName,
      movementsCount: movements.length,
      sampleMovement: movements[0]
    });

    // Importar usando el servicio que maneja la creación del cliente y movimientos
    const importedData = await movementService.importCustomerData(
      customerName,
      movements,
      req.user!.uid
    );
    
    return res.status(201).json({
      success: true,
      data: importedData,
      message: `Cliente "${customerName}" importado con ${movements.length} movimientos`
    });
  } catch (error) {
    console.error('Error importando datos desde Excel:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error importando datos'
    });
  }
});

export default router;
