'use client';

import { useState } from 'react';
import { Sale, PAYMENT_METHODS } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Edit2, 
  Trash2, 
  DollarSign, 
  CreditCard,
  MoreVertical,
  Calculator
} from 'lucide-react';
import { SalesService } from '@/services/salesService';
import { useAuth } from '@/contexts/AuthContext';

interface SalesListProps {
  sales: Sale[];
  loading: boolean;
  onSaleUpdated: () => void;
}

export const SalesList = ({ sales, loading, onSaleUpdated }: SalesListProps) => {
  const { getIdToken } = useAuth();
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPaymentMethodLabel = (method: string) => {
    const paymentMethod = PAYMENT_METHODS.find(p => p.value === method);
    return paymentMethod?.label || method;
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
      return;
    }

    setDeletingSaleId(saleId);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('No hay token de autenticación');

      await SalesService.deleteSale(saleId, token);
      onSaleUpdated();
    } catch (error) {
      console.error('Error eliminando venta:', error);
      alert('Error al eliminar la venta');
    } finally {
      setDeletingSaleId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-12 text-center">
          <DollarSign className="mx-auto w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay ventas registradas
          </h3>
          <p className="text-gray-600">
            Comienza registrando tu primera venta del día
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medio de Pago
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Efectivo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Digital
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comisión
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hora
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                    {sale.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {sale.paymentMethod === 'efectivo' ? (
                      <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-blue-600 mr-2" />
                    )}
                    <span className="text-sm text-gray-900">
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-green-600">
                    {sale.cashAmount > 0 ? formatCurrency(sale.cashAmount) : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-blue-600">
                    {sale.digitalAmount > 0 ? formatCurrency(sale.digitalAmount) : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {sale.commissionAmount > 0 && (
                      <Calculator className="w-4 h-4 text-red-600 mr-1" />
                    )}
                    <span className="text-sm font-medium text-red-600">
                      {sale.commissionAmount > 0 ? formatCurrency(sale.commissionAmount) : '-'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(sale.createdAt), 'HH:mm', { locale: es })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleDeleteSale(sale.id)}
                      disabled={deletingSaleId === sale.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
