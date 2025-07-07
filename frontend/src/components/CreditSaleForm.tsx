'use client';

import { useState } from 'react';
import { Customer, CreateAccountMovementData } from '@/types';
import { CreditCard, DollarSign, Calendar, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CreditSaleFormProps {
  customer: Customer;
  onSaleCreated: () => void;
  onClose: () => void;
}

export const CreditSaleForm: React.FC<CreditSaleFormProps> = ({ customer, onSaleCreated, onClose }) => {
  const { getIdToken } = useAuth();
  const [formData, setFormData] = useState({
    description: '',
    code: '',
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
      
      // Crear el objeto de datos eliminando campos vacíos
      const movementData: CreateAccountMovementData = {
        customerId: customer.id!,
        description: formData.description,
        amount: amount,
        type: 'sale',
        date: formData.date
      };

      // Solo agregar el código si tiene un valor válido
      if (formData.code && formData.code.trim() !== '') {
        movementData.code = formData.code.trim();
      }

      const response = await fetch('/api/account-movements', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(movementData)
      });

      if (!response.ok) {
        throw new Error('Error al registrar la venta');
      }

      onSaleCreated();
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
          <CreditCard className="text-blue-600" size={24} />
          <h3 className="text-xl font-semibold text-gray-800">Venta a Crédito</h3>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-700">Cliente:</span>
            <span className="text-sm text-gray-900">{customer.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Límite disponible:</span>
            <span className="text-sm text-green-600 font-medium">
              ${((customer.creditLimit || 0) - 0).toFixed(2)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              <FileText size={16} className="inline mr-1" />
              Descripción *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
              placeholder="Ej: Prenda #123"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Código (opcional)
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
              placeholder="Ej: P123"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold placeholder-gray-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Fecha
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Registrando...' : 'Registrar Venta'}
              <CreditCard size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
