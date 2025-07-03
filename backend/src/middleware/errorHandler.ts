import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Error de validación
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: error.message
    });
  }

  // Error de Firebase
  if (error.code && error.code.startsWith('auth/')) {
    return res.status(401).json({
      success: false,
      error: 'Error de autenticación'
    });
  }

  // Error genérico
  return res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
};
