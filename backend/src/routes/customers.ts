import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import { CustomerService } from '../services/customerService';

const router = Router();
const customerService = new CustomerService();

// Obtener todos los clientes
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, hasDebt } = req.query;
    
    const filters = {
      name: name as string,
      hasDebt: hasDebt === 'true',
      userId: req.user!.uid
    };

    const customers = await customerService.getCustomers(filters);
    
    return res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo clientes'
    });
  }
});

// Buscar clientes
router.get('/search', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Parámetro de búsqueda requerido'
      });
    }

    const customers = await customerService.searchCustomers(q, req.user!.uid);
    
    return res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error buscando clientes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error buscando clientes'
    });
  }
});

// Crear nuevo cliente
router.post('/', [
  body('name').notEmpty().withMessage('Nombre es requerido'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email debe ser válido'),
  body('phone').optional({ checkFalsy: true }),
  body('address').optional({ checkFalsy: true }),
  body('taxId').optional({ checkFalsy: true }),
  body('creditLimit').optional().isFloat({ min: 0 }).withMessage('Límite de crédito debe ser un número positivo'),
  body('notes').optional({ checkFalsy: true })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📝 Datos recibidos para crear cliente:', req.body);
    console.log('👤 Usuario autenticado:', req.user?.uid);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errores de validación:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const customerData = {
      ...req.body,
      userId: req.user!.uid
    };

    console.log('🔄 Datos del cliente a crear:', customerData);

    const customer = await customerService.createCustomer(customerData);
    
    console.log('✅ Cliente creado exitosamente:', customer);
    
    return res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('💥 Error creando cliente:', error);
    return res.status(500).json({
      success: false,
      error: 'Error creando cliente'
    });
  }
});

// Obtener cliente por ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id, req.user!.uid);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    return res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo cliente'
    });
  }
});

// Actualizar cliente
router.put('/:id', [
  body('name').optional({ checkFalsy: true }).notEmpty().withMessage('Nombre es requerido'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email debe ser válido'),
  body('phone').optional({ checkFalsy: true }),
  body('address').optional({ checkFalsy: true }),
  body('taxId').optional({ checkFalsy: true }),
  body('creditLimit').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Límite de crédito debe ser un número positivo'),
  body('notes').optional({ checkFalsy: true })
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
    const customer = await customerService.updateCustomer(id, req.body, req.user!.uid);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    return res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    return res.status(500).json({
      success: false,
      error: 'Error actualizando cliente'
    });
  }
});

// Eliminar cliente
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await customerService.deleteCustomer(id, req.user!.uid);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    return res.json({
      success: true,
      message: 'Cliente eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    return res.status(500).json({
      success: false,
      error: 'Error eliminando cliente'
    });
  }
});

export default router;
