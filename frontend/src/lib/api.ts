// Importar tipos necesarios
import { Customer, CreateCustomerData, AccountMovement, CreateAccountMovementData, ImportCustomerData } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, data.error || 'Error en la API');
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Error de conexión');
  }
}

// Servicios de clientes
export const customerService = {
  async getCustomers(filters: { name?: string } = {}, token?: string) {
    const queryParams = new URLSearchParams();
    if (filters.name) queryParams.append('search', filters.name);
    
    const endpoint = `/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest<{ success: boolean; data: Customer[] }>(endpoint, {}, token);
    return response.data || [];
  },

  async createCustomer(data: CreateCustomerData, token?: string) {
    const response = await apiRequest<{ success: boolean; data: Customer }>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
    return response.data;
  },

  async updateCustomer(id: string, data: Partial<CreateCustomerData>, token?: string) {
    const response = await apiRequest<{ success: boolean; data: Customer }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
    return response.data;
  },

  async deleteCustomer(id: string, token?: string) {
    await apiRequest<{ success: boolean }>(`/customers/${id}`, {
      method: 'DELETE',
    }, token);
  },
};

// Servicios de movimientos de cuenta corriente
export const accountMovementService = {
  async getMovements(filters: { customerId?: string } = {}, token?: string) {
    const queryParams = new URLSearchParams();
    if (filters.customerId) queryParams.append('customerId', filters.customerId);
    
    const endpoint = `/account-movements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest<{ success: boolean; data: AccountMovement[] }>(endpoint, {}, token);
    return response.data || [];
  },

  async createMovement(data: CreateAccountMovementData, token?: string) {
    const response = await apiRequest<{ success: boolean; data: AccountMovement }>('/account-movements', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
    return response.data;
  },

  async importMovements(data: ImportCustomerData, token?: string) {
    const response = await apiRequest<{ success: boolean; data: { customer: Customer; movements: AccountMovement[] } }>('/account-movements/import-excel', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
    return response.data;
  },
};
