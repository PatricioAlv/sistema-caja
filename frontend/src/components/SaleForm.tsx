'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SalesService } from '@/services/salesService';
import { CreateSaleData, PAYMENT_METHODS, CARD_BRANDS, INSTALLMENT_OPTIONS } from '@/types';
import { X, Loader2, DollarSign } from 'lucide-react';

interface SaleFormProps {
  onClose: () => void;
  onSaleCreated: () => void;
}

export const SaleForm = ({ onClose, onSaleCreated }: SaleFormProps) => {
  const { getIdToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateSaleData>({
    description: '',
    amount: 0,
    paymentMethod: 'efectivo'
    // Intencionalmente NO incluimos cardBrand ni installments para evitar undefined
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.description.trim()) {
      setError('La descripción es requerida');
      return;
    }

    if (formData.amount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (formData.paymentMethod === 'tarjeta_credito') {
      if (!formData.cardBrand) {
        setError('Selecciona la marca de la tarjeta');
        return;
      }
      if (!formData.installments) {
        setError('Selecciona la cantidad de cuotas');
        return;
      }
    }

    setLoading(true);

    try {
      const token = await getIdToken();
      if (!token) throw new Error('No hay token de autenticación');

      // Filtrar campos undefined antes de enviar
      const cleanFormData: CreateSaleData = {
        description: formData.description,
        amount: formData.amount,
        paymentMethod: formData.paymentMethod
      };

      // Solo agregar cardBrand e installments si están definidos
      if (formData.cardBrand) {
        cleanFormData.cardBrand = formData.cardBrand;
      }
      if (formData.installments) {
        cleanFormData.installments = formData.installments;
      }
      if (formData.date) {
        cleanFormData.date = formData.date;
      }

      console.log('Enviando datos:', cleanFormData);
      await SalesService.createSale(cleanFormData, token);
      onSaleCreated();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la venta';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: name === 'amount' ? parseFloat(value) || 0 : value
      };

      // Si cambia el medio de pago y no es tarjeta de crédito, limpiar campos relacionados
      if (name === 'paymentMethod' && value !== 'tarjeta_credito') {
        delete newData.cardBrand;
        delete newData.installments;
      }

      return newData;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <DollarSign className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Nueva Venta</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500"
              placeholder="Ej: Venta de producto X, servicio Y..."
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-bold text-gray-900 mb-2">
              Monto
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 font-semibold">$</span>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ''}
                onChange={handleInputChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-bold text-gray-900 mb-2">
              Medio de Pago
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
              required
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Campos adicionales para tarjeta de crédito */}
          {formData.paymentMethod === 'tarjeta_credito' && (
            <>
              <div>
                <label htmlFor="cardBrand" className="block text-sm font-bold text-gray-900 mb-2">
                  Marca de Tarjeta
                </label>
                <select
                  id="cardBrand"
                  name="cardBrand"
                  value={formData.cardBrand || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  required
                >
                  <option value="">Seleccionar marca...</option>
                  {CARD_BRANDS.map((brand) => (
                    <option key={brand.value} value={brand.value}>
                      {brand.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="installments" className="block text-sm font-bold text-gray-900 mb-2">
                  Cantidad de Cuotas
                </label>
                <select
                  id="installments"
                  name="installments"
                  value={formData.installments || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  required
                >
                  <option value="">Seleccionar cuotas...</option>
                  {INSTALLMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

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
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  Guardando...
                </>
              ) : (
                'Crear Venta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
