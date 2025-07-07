'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WithdrawalService } from '@/services/withdrawalService';
import { CreateWithdrawalData, WITHDRAWAL_REASONS } from '@/types';
import { X, Loader2, Minus } from 'lucide-react';

interface WithdrawalFormProps {
  onClose: () => void;
  onWithdrawalCreated: () => void;
}

export const WithdrawalForm = ({ onClose, onWithdrawalCreated }: WithdrawalFormProps) => {
  const { getIdToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateWithdrawalData>({
    amount: 0,
    reason: 'gastos_operativos',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = await getIdToken();
      if (!token) throw new Error('No hay token de autenticación');

      await WithdrawalService.createWithdrawal(formData, token);
      onWithdrawalCreated();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el retiro';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Minus className="w-6 h-6 text-red-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Nuevo Retiro de Efectivo</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-bold text-gray-900 mb-2">
              Monto *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 font-semibold">$</span>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount || ''}
                onChange={handleInputChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 font-semibold placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-bold text-gray-900 mb-2">
              Motivo del Retiro *
            </label>
            <select
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 font-medium"
              required
            >
              {WITHDRAWAL_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-bold text-gray-900 mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500"
              placeholder="Ej: Pago de alquiler, compra de insumos, etc..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  Guardando...
                </>
              ) : (
                'Registrar Retiro'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
