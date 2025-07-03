import { apiRequest } from '@/lib/api';
import { Sale, CreateSaleData, SalesFilters, ApiResponse, DailySummary } from '@/types';

export class SalesService {
  static async createSale(data: CreateSaleData, token: string): Promise<Sale> {
    const response = await apiRequest<ApiResponse<Sale>>(
      '/sales',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token
    );
    return response.data!;
  }

  static async getSales(filters: Partial<SalesFilters>, token: string): Promise<Sale[]> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);

    const response = await apiRequest<ApiResponse<Sale[]>>(
      `/sales?${params.toString()}`,
      {},
      token
    );
    return response.data!;
  }

  static async getSaleById(id: string, token: string): Promise<Sale> {
    const response = await apiRequest<ApiResponse<Sale>>(
      `/sales/${id}`,
      {},
      token
    );
    return response.data!;
  }

  static async updateSale(id: string, data: Partial<CreateSaleData>, token: string): Promise<Sale> {
    const response = await apiRequest<ApiResponse<Sale>>(
      `/sales/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      token
    );
    return response.data!;
  }

  static async deleteSale(id: string, token: string): Promise<void> {
    await apiRequest<ApiResponse>(
      `/sales/${id}`,
      {
        method: 'DELETE',
      },
      token
    );
  }

  static async getDailySummary(date: string, token: string): Promise<DailySummary> {
    const response = await apiRequest<ApiResponse<DailySummary>>(
      `/summary/daily/${date}`,
      {},
      token
    );
    return response.data!;
  }

  static async getRangeSummary(startDate: string, endDate: string, token: string): Promise<DailySummary[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    const response = await apiRequest<ApiResponse<DailySummary[]>>(
      `/summary/range?${params.toString()}`,
      {},
      token
    );
    return response.data!;
  }
}
