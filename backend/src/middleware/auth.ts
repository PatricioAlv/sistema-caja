import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔐 Auth header recibido:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No se encontró header de autorización válido');
      return res.status(401).json({
        success: false,
        error: 'Token de autorización requerido'
      });
    }

    const token = authHeader.substring(7);
    console.log('🎫 Token extraído (primeros 50 caracteres):', token.substring(0, 50) + '...');
    
    try {
      const decodedToken = await auth.verifyIdToken(token);
      console.log('✅ Token verificado exitosamente para usuario:', decodedToken.uid);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email
      };
      return next();
    } catch (error) {
      console.error('Error verificando token:', error);
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};
