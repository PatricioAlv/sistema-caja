import { Response } from 'express';
import { BusinessConfig } from '../../../shared/types';
import { firestore } from '../config/firebase';
import { AuthenticatedRequest } from '../middleware/auth';

export class BusinessService {
  private collection = firestore.collection('businessConfig');

  async getBusinessConfig(userId: string): Promise<BusinessConfig | null> {
    try {
      const query = this.collection.where('userId', '==', userId);
      const querySnapshot = await query.get();
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as BusinessConfig;
    } catch (error) {
      console.error('Error al obtener la configuración del negocio:', error);
      throw error;
    }
  }

  async createBusinessConfig(config: Omit<BusinessConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessConfig> {
    try {
      const now = new Date().toISOString();
      const newConfig: BusinessConfig = {
        ...config,
        createdAt: now,
        updatedAt: now
      };

      // Verificar si ya existe una configuración para este usuario
      const existingConfig = await this.getBusinessConfig(config.userId);
      if (existingConfig) {
        throw new Error('Ya existe una configuración para este usuario');
      }

      const docRef = this.collection.doc();
      await docRef.set(newConfig);
      
      return {
        id: docRef.id,
        ...newConfig
      };
    } catch (error) {
      console.error('Error al crear la configuración del negocio:', error);
      throw error;
    }
  }

  async updateBusinessConfig(userId: string, updates: Partial<BusinessConfig>): Promise<BusinessConfig> {
    try {
      const existingConfig = await this.getBusinessConfig(userId);
      if (!existingConfig || !existingConfig.id) {
        throw new Error('No se encontró la configuración del negocio');
      }

      const updatedConfig = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const docRef = this.collection.doc(existingConfig.id);
      await docRef.update(updatedConfig);
      
      return {
        ...existingConfig,
        ...updatedConfig
      };
    } catch (error) {
      console.error('Error al actualizar la configuración del negocio:', error);
      throw error;
    }
  }

  async getBusinessConfigHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const config = await this.getBusinessConfig(userId);
      if (!config) {
        res.status(404).json({ error: 'Configuración no encontrada' });
        return;
      }

      res.json(config);
    } catch (error) {
      console.error('Error al obtener la configuración del negocio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async createBusinessConfigHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const configData = req.body;
      const config = await this.createBusinessConfig({
        ...configData,
        userId
      });

      res.status(201).json(config);
    } catch (error) {
      console.error('Error al crear la configuración del negocio:', error);
      if (error instanceof Error && error.message === 'Ya existe una configuración para este usuario') {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async updateBusinessConfigHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const updates = req.body;
      const config = await this.updateBusinessConfig(userId, updates);

      res.json(config);
    } catch (error) {
      console.error('Error al actualizar la configuración del negocio:', error);
      if (error instanceof Error && error.message === 'No se encontró la configuración del negocio') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

export const businessService = new BusinessService();
