'use client';

import { useState } from 'react';
import { Withdrawal, WITHDRAWAL_REASONS } from '@/types';
import { WithdrawalService } from '@/services/withdrawalService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, Minus, Eye } from 'lucide-react';

interface WithdrawalsListProps {
  withdrawals: Withdrawal[];
  loading: boolean;
  onWithdrawalDeleted: () => void;
}

export const WithdrawalsList = ({ withdrawals, loading, onWithdrawalDeleted }: WithdrawalsListProps) => {
  const { getIdToken } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este retiro?')) {
      return;
    }

    try {
      setDeletingId(id);
      const token = await getIdToken();
      if (!token) throw new Error('No hay token de autenticación');

      await WithdrawalService.deleteWithdrawal(id, token);
      onWithdrawalDeleted();
    } catch (error) {
      console.error('Error eliminando retiro:', error);
      alert('Error al eliminar el retiro');
    } finally {
      setDeletingId(null);
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasonObj = WITHDRAWAL_REASONS.find(r => r.value === reason);
    return reasonObj?.label || reason;
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <Minus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay retiros registrados</h3>
        <p className="text-gray-600">Los retiros que registres aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="divide-y divide-gray-200">
        {withdrawals.map((withdrawal) => (
          <div key={withdrawal.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <Minus className="w-4 h-4 text-red-600" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-red-600">
                          -${withdrawal.amount.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(withdrawal.date), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {getReasonLabel(withdrawal.reason)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {withdrawal.description && (
                      <button
                        onClick={() => toggleExpanded(withdrawal.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Ver descripción"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(withdrawal.id)}
                      disabled={deletingId === withdrawal.id}
                      className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                      title="Eliminar retiro"
                    >
                      {deletingId === withdrawal.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Descripción expandible */}
                {expandedId === withdrawal.id && withdrawal.description && (
                  <div className="mt-3 ml-11 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{withdrawal.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
