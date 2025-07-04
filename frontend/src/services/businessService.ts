import { BusinessConfig } from '@/types';

export class BusinessService {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  static async getBusinessConfig(token: string): Promise<BusinessConfig | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/business`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null; // No hay configuración aún
      }

      if (!response.ok) {
        throw new Error('Error al obtener la configuración del negocio');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener la configuración del negocio:', error);
      throw error;
    }
  }

  static async createBusinessConfig(config: Omit<BusinessConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, token: string): Promise<BusinessConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/api/business`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Error al crear la configuración del negocio');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al crear la configuración del negocio:', error);
      throw error;
    }
  }

  static async updateBusinessConfig(config: Partial<BusinessConfig>, token: string): Promise<BusinessConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/api/business`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la configuración del negocio');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al actualizar la configuración del negocio:', error);
      throw error;
    }
  }

  static async saveBusinessConfig(config: Omit<BusinessConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, token: string): Promise<BusinessConfig> {
    try {
      // Primero intentar obtener la configuración existente
      const existingConfig = await this.getBusinessConfig(token);
      
      if (existingConfig) {
        // Si existe, actualizar
        return await this.updateBusinessConfig(config, token);
      } else {
        // Si no existe, crear
        return await this.createBusinessConfig(config, token);
      }
    } catch (error) {
      console.error('Error al guardar la configuración del negocio:', error);
      throw error;
    }
  }
}
