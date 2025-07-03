import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { SummaryService } from '../services/summaryService';

const router = Router();
const summaryService = new SummaryService();

// Obtener resumen diario
router.get('/daily/:date', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date } = req.params;
    const summary = await summaryService.getDailySummary(date, req.user!.uid);
    
    return res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error obteniendo resumen diario:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo resumen diario'
    });
  }
});

// Obtener resumen por rango de fechas
router.get('/range', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Fechas de inicio y fin son requeridas'
      });
    }

    const summaries = await summaryService.getRangeSummary(
      startDate as string,
      endDate as string,
      req.user!.uid
    );
    
    return res.json({
      success: true,
      data: summaries
    });
  } catch (error) {
    console.error('Error obteniendo resumen por rango:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo resumen por rango'
    });
  }
});

export default router;
