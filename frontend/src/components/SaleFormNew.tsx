'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SalesService } from '@/services/salesService';
import { SaleItem, PaymentMethodSale } from '@/types';
import { X, Plus, Trash2, Calculator, DollarSign, Package, Loader2 } from 'lucide-react';

interface SaleFormProps {
  onClose: () => void;
  onSaleCreated: () => void;
}

export const SaleForm = ({ onClose, onSaleCreated }: SaleFormProps) => {
  const { getIdToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para items
  const [items, setItems] = useState<SaleItem[]>([
    { id: '1', code: '', name: '', price: 0, quantity: 1, subtotal: 0 }
  ]);
  
  // Estado para medios de pago
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSale[]>([
    { type: 'efectivo', amount: 0, commission: 0 }
  ]);

  // Funciones para manejar items
  const addItem = () => {
    const newItem: SaleItem = {
      id: Date.now().toString(),
      code: '',
      name: '',
      price: 0,
      quantity: 1,
      subtotal: 0
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof SaleItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'price' || field === 'quantity') {
          updatedItem.subtotal = Number(updatedItem.price) * Number(updatedItem.quantity);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Funciones para medios de pago
  const addPaymentMethod = () => {
    if (paymentMethods.length < 2) {
      const newMethod: PaymentMethodSale = {
        type: 'efectivo',
        amount: 0,
        commission: 0
      };
      setPaymentMethods([...paymentMethods, newMethod]);
    }
  };

  const updatePaymentMethod = (index: number, field: keyof PaymentMethodSale, value: string | number) => {
    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], [field]: value };
    
    // Calcular comisión automáticamente (por ahora 0, implementar después)
    if (field === 'type' || field === 'amount' || field === 'brand' || field === 'installments') {
      // TODO: Implementar cálculo de comisión
      updatedMethods[index].commission = 0;
    }
    
    setPaymentMethods(updatedMethods);
  };

  const removePaymentMethod = (index: number) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
    }
  };

  // Cálculos totales
  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  };

  const getTotalPayments = () => {
    return paymentMethods.reduce((sum, method) => sum + Number(method.amount), 0);
  };

  const getTotalCommissions = () => {
    return paymentMethods.reduce((sum, method) => sum + Number(method.commission), 0);
  };

  // Equilibrar pagos automáticamente
  const autoBalancePayments = () => {
    const total = getTotalAmount();
    if (paymentMethods.length === 1) {
      updatePaymentMethod(0, 'amount', total);
    } else if (paymentMethods.length === 2 && total > 0) {
      // Dividir 50/50 por defecto
      const half = total / 2;
      updatePaymentMethod(0, 'amount', half);
      updatePaymentMethod(1, 'amount', half);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    const validItems = items.filter(item => item.name.trim() && item.price > 0);
    if (validItems.length === 0) {
      setError('Debe agregar al menos un artículo válido');
      return;
    }

    const totalAmount = getTotalAmount();
    const totalPayments = getTotalPayments();
    
    if (Math.abs(totalAmount - totalPayments) > 0.01) {
      setError(`El total de pagos ($${totalPayments.toFixed(2)}) debe coincidir con el total de la venta ($${totalAmount.toFixed(2)})`);
      return;
    }

    // Validar medios de pago con tarjetas
    for (const method of paymentMethods) {
      if (method.type === 'tarjeta_credito' && (!method.brand || !method.installments)) {
        setError('Complete la marca y cuotas para las tarjetas de crédito');
        return;
      }
      if (method.amount <= 0) {
        setError('Todos los medios de pago deben tener un monto mayor a 0');
        return;
      }
    }

    setLoading(true);

    try {
      const token = await getIdToken();
      if (!token) {
        setError('No se pudo obtener el token de autenticación');
        return;
      }
      
      // Por ahora, convertir a formato legacy para mantener compatibilidad
      const legacySaleData = {
        description: validItems.map(item => `${item.name} (${item.code})`).join(', '),
        amount: totalAmount,
        paymentMethod: paymentMethods[0].type,
        cardBrand: paymentMethods[0].brand,
        installments: paymentMethods[0].installments
      };

      await SalesService.createSale(legacySaleData, token);
      onSaleCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            
            {/* Sección de Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Artículos</h3>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Item
                </button>
              </div>
              
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                      <input
                        type="text"
                        value={item.code}
                        onChange={(e) => updateItem(item.id, 'code', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        placeholder="SKU"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Artículo</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Nombre del artículo"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.price || ''}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <div className="text-sm font-medium text-gray-900 mb-2">
                        ${item.subtotal.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1 flex items-end">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección de Medios de Pago */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Calculator className="w-5 h-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Medios de Pago</h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={autoBalancePayments}
                    className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Auto Balance
                  </button>
                  {paymentMethods.length < 2 && (
                    <button
                      type="button"
                      onClick={addPaymentMethod}
                      className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Medio
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Medio de Pago {index + 1}
                        </label>
                        <select
                          value={method.type}
                          onChange={(e) => updatePaymentMethod(index, 'type', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="qr">QR</option>
                          <option value="tarjeta_debito">Tarjeta Débito</option>
                          <option value="tarjeta_credito">Tarjeta Crédito</option>
                        </select>
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                        <input
                          type="number"
                          step="0.01"
                          value={method.amount || ''}
                          onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          placeholder="0.00"
                          required
                        />
                      </div>

                      {(method.type === 'tarjeta_credito' || method.type === 'tarjeta_debito') && (
                        <>
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                            <select
                              value={method.brand || ''}
                              onChange={(e) => updatePaymentMethod(index, 'brand', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              required
                            >
                              <option value="">Seleccionar</option>
                              <option value="visa">Visa</option>
                              <option value="mastercard">Mastercard</option>
                              <option value="naranja">Naranja</option>
                              <option value="tuya">Tuya</option>
                            </select>
                          </div>
                          
                          {method.type === 'tarjeta_credito' && (
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Cuotas</label>
                              <select
                                value={method.installments || ''}
                                onChange={(e) => updatePaymentMethod(index, 'installments', parseInt(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                required
                              >
                                <option value="">Seleccionar</option>
                                <option value="1">1 cuota</option>
                                <option value="3">3 cuotas</option>
                                <option value="6">6 cuotas</option>
                                <option value="12">12 cuotas</option>
                              </select>
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="col-span-2 flex items-end">
                        <div className="text-sm text-gray-600 mb-2">
                          Comisión: ${method.commission.toFixed(2)}
                        </div>
                      </div>
                      
                      {paymentMethods.length > 1 && (
                        <div className="col-span-1 flex items-end">
                          <button
                            type="button"
                            onClick={() => removePaymentMethod(index)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Resumen de la Venta</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex justify-between">
                    <span>Total Artículos:</span>
                    <span className="font-medium">${getTotalAmount().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Pagos:</span>
                    <span className="font-medium">${getTotalPayments().toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span>Total Comisiones:</span>
                    <span className="font-medium text-red-600">-${getTotalCommissions().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-semibold">Neto:</span>
                    <span className="font-semibold text-green-600">${(getTotalAmount() - getTotalCommissions()).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {Math.abs(getTotalAmount() - getTotalPayments()) > 0.01 && (
                <div className="mt-2 text-center text-red-600 text-sm">
                  Diferencia: ${Math.abs(getTotalAmount() - getTotalPayments()).toFixed(2)}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || Math.abs(getTotalAmount() - getTotalPayments()) > 0.01}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Venta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
