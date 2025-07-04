import { CommissionConfig, DefaultCommissions } from '@/types';

export class CommissionService {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Obtener configuraciones de comisiones del usuario
  static async getCommissions(token: string): Promise<CommissionConfig[]> {
    const response = await fetch(`${this.baseUrl}/api/commissions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener configuraciones de comisiones');
    }

    const result = await response.json();
    return result.data;
  }

  // Obtener configuraciones organizadas por tipo
  static async getOrganizedCommissions(token: string): Promise<DefaultCommissions> {
    const response = await fetch(`${this.baseUrl}/api/commissions/organized`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener configuraciones organizadas');
    }

    const result = await response.json();
    return result.data;
  }

  // Crear configuraciones predeterminadas
  static async createDefaultCommissions(token: string): Promise<CommissionConfig[]> {
    const response = await fetch(`${this.baseUrl}/api/commissions/default`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al crear configuraciones predeterminadas');
    }

    const result = await response.json();
    return result.data;
  }

  // Actualizar una configuración de comisión
  static async updateCommission(
    commissionId: string,
    updates: Partial<CommissionConfig>,
    token: string
  ): Promise<CommissionConfig> {
    const response = await fetch(`${this.baseUrl}/api/commissions/${commissionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar configuración de comisión');
    }

    const result = await response.json();
    return result.data;
  }

  // Calcular comisión para una venta
  static async calculateCommission(
    paymentMethod: string,
    amount: number,
    token: string,
    cardBrand?: string,
    installments?: number
  ): Promise<{ commission: number; netAmount: number }> {
    const response = await fetch(`${this.baseUrl}/api/commissions/calculate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentMethod,
        amount,
        cardBrand,
        installments,
      }),
    });

    if (!response.ok) {
      throw new Error('Error al calcular comisión');
    }

    const result = await response.json();
    return result.data;
  }
}
