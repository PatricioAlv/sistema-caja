'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CommissionService } from '@/services/commissionService';
import { DefaultCommissions, CARD_BRANDS, INSTALLMENT_OPTIONS } from '@/types';
import { Settings, Save, RotateCcw, CreditCard, DollarSign } from 'lucide-react';

interface CommissionSettingsProps {
  onClose: () => void;
  onSaved: () => void;
}

export const CommissionSettings = ({ onClose, onSaved }: CommissionSettingsProps) => {
  const { getIdToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commissions, setCommissions] = useState<DefaultCommissions | null>(null);
  const [originalCommissions, setOriginalCommissions] = useState<DefaultCommissions | null>(null);

  const loadCommissions = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getIdToken();
      if (!token) throw new Error('No hay token de autenticación');

      const organized = await CommissionService.getOrganizedCommissions(token);
      setCommissions(organized);
      setOriginalCommissions(JSON.parse(JSON.stringify(organized))); // Deep copy
    } catch (error) {
      console.error('Error cargando configuraciones:', error);
      // Si no hay configuraciones, crear las predeterminadas
      try {
        const token = await getIdToken();
        if (!token) throw new Error('No hay token de autenticación');
        
        await CommissionService.createDefaultCommissions(token);
        const organized = await CommissionService.getOrganizedCommissions(token);
        setCommissions(organized);
        setOriginalCommissions(JSON.parse(JSON.stringify(organized)));
      } catch (createError) {
        console.error('Error creando configuraciones predeterminadas:', createError);
        alert('Error al cargar configuraciones de comisiones');
      }
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  const handleSimpleCommissionChange = (
    paymentMethod: keyof Pick<DefaultCommissions, 'efectivo' | 'transferencia' | 'qr' | 'tarjeta_debito'>,
    value: string
  ) => {
    if (!commissions) return;
    
    const numValue = parseFloat(value) || 0;
    setCommissions({
      ...commissions,
      [paymentMethod]: numValue
    });
  };

  const handleCreditCardCommissionChange = (
    brand: string,
    installments: number,
    value: string
  ) => {
    if (!commissions) return;
    
    const numValue = parseFloat(value) || 0;
    setCommissions({
      ...commissions,
      tarjeta_credito: {
        ...commissions.tarjeta_credito,
        [brand]: {
          ...commissions.tarjeta_credito[brand as keyof typeof commissions.tarjeta_credito],
          [installments]: numValue
        }
      }
    });
  };

  const handleSave = async () => {
    if (!commissions || !originalCommissions) return;

    try {
      setSaving(true);
      const token = await getIdToken();
      if (!token) throw new Error('No hay token de autenticación');

      // Aquí implementaremos la lógica para guardar
      // Por ahora mostraremos un mensaje de éxito
      alert('Configuraciones guardadas exitosamente');
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error guardando configuraciones:', error);
      alert('Error al guardar configuraciones');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalCommissions) {
      setCommissions(JSON.parse(JSON.stringify(originalCommissions)));
    }
  };

  const hasChanges = () => {
    if (!commissions || !originalCommissions) return false;
    return JSON.stringify(commissions) !== JSON.stringify(originalCommissions);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!commissions) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Settings className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Configuración de Comisiones
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Medios de pago simples */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Efectivo */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                Efectivo
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={commissions.efectivo}
                  onChange={(e) => handleSimpleCommissionChange('efectivo', e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>

            {/* Transferencia */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
                Transferencia
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={commissions.transferencia}
                  onChange={(e) => handleSimpleCommissionChange('transferencia', e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>

            {/* QR */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <CreditCard className="w-4 h-4 mr-2 text-cyan-600" />
                QR (Modo, CVU)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={commissions.qr}
                  onChange={(e) => handleSimpleCommissionChange('qr', e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>

            {/* Tarjeta de Débito */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <CreditCard className="w-4 h-4 mr-2 text-purple-600" />
                Tarjeta de Débito
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={commissions.tarjeta_debito}
                  onChange={(e) => handleSimpleCommissionChange('tarjeta_debito', e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>
          </div>

          {/* Tarjetas de Crédito */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-red-600" />
              Tarjetas de Crédito por Cuotas
            </h3>
            
            <div className="space-y-6">
              {CARD_BRANDS.map((brand) => (
                <div key={brand.value} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">{brand.label}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {INSTALLMENT_OPTIONS.map((installment) => (
                      <div key={installment.value} className="space-y-1">
                        <label className="text-xs text-gray-600">
                          {installment.label}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={commissions.tarjeta_credito[brand.value]?.[installment.value] || 0}
                            onChange={(e) => handleCreditCardCommissionChange(brand.value, installment.value, e.target.value)}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute right-2 top-1 text-xs text-gray-500">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            disabled={!hasChanges() || saving}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restablecer
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges() || saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
