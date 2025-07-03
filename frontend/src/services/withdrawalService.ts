import { Withdrawal, CreateWithdrawalData, WithdrawalFilters, ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class WithdrawalService {
  static async createWithdrawal(data: CreateWithdrawalData, token: string): Promise<Withdrawal> {
    const response = await fetch(`${API_URL}/api/withdrawals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result: ApiResponse<Withdrawal> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error al crear retiro');
    }

    return result.data!;
  }

  static async getWithdrawals(filters: Omit<WithdrawalFilters, 'userId'>, token: string): Promise<Withdrawal[]> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.reason) params.append('reason', filters.reason);

    const response = await fetch(`${API_URL}/api/withdrawals?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: ApiResponse<Withdrawal[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error al obtener retiros');
    }

    return result.data || [];
  }

  static async getWithdrawal(id: string, token: string): Promise<Withdrawal> {
    const response = await fetch(`${API_URL}/api/withdrawals/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: ApiResponse<Withdrawal> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error al obtener retiro');
    }

    return result.data!;
  }

  static async updateWithdrawal(id: string, data: Partial<CreateWithdrawalData>, token: string): Promise<Withdrawal> {
    const response = await fetch(`${API_URL}/api/withdrawals/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result: ApiResponse<Withdrawal> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error al actualizar retiro');
    }

    return result.data!;
  }

  static async deleteWithdrawal(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/withdrawals/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: ApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error al eliminar retiro');
    }
  }
}
