'use client';

import { useState } from 'react';
import { Customer, CreateAccountMovementData } from '@/types';
import { DollarSign, Calendar, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentFormProps {
  customer: Customer;
  onPaymentCreated: () => void;
  onClose: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ customer, onPaymentCreated, onClose }) => {
  const { getIdToken } = useAuth();
  const [formData, setFormData] = useState({
    description: 'Pago recibido',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (!formData.amount || amount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      
      const movementData: CreateAccountMovementData = {
        customerId: customer.id!,
        description: formData.description,
        amount: -amount, // Negativo porque es un pago
        type: 'payment',
        date: formData.date
      };

      const response = await fetch('/api/account-movements', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(movementData)
      });

      if (!response.ok) {
        throw new Error('Error al registrar el pago');
      }

      onPaymentCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="text-green-600" size={24} />
          <h3 className="text-xl font-semibold text-gray-800">Registrar Pago</h3>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-700">Cliente:</span>
            <span className="text-sm text-gray-900">{customer.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Saldo actual:</span>
            <span className="text-sm text-red-600 font-medium">
              ${(0).toFixed(2)} {/* Este valor debe calcularse desde los movimientos */}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText size={16} className="inline mr-1" />
              Descripción
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
              placeholder="Ej: Pago en efectivo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign size={16} className="inline mr-1" />
              Monto *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Fecha
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Registrando...' : 'Registrar Pago'}
              <CheckCircle size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
