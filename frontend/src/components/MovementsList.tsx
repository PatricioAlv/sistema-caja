'use client';

import { useState } from 'react';
import { Sale, Withdrawal, WITHDRAWAL_REASONS, PAYMENT_METHODS } from '@/types';
import { SalesService } from '@/services/salesService';
import { WithdrawalService } from '@/services/withdrawalService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, Minus, Eye, Clock, DollarSign, CreditCard, Calculator, FileText } from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';

// Tipo unificado para movimientos
interface Movement {
  id: string;
  type: 'sale' | 'withdrawal';
  amount: number;
  description: string;
  time: string;
  data: Sale | Withdrawal;
}

interface MovementsListProps {
  sales: Sale[];
  withdrawals: Withdrawal[];
  loading: boolean;
  onMovementDeleted: () => void;
}

export const MovementsList = ({ sales, withdrawals, loading, onMovementDeleted }: MovementsListProps) => {
  const { getIdToken } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<{ type: 'sale' | 'withdrawal', data: Sale | Withdrawal } | null>(null);

  // Combinar y ordenar movimientos por hora
  const movements: Movement[] = [
    // Convertir ventas
    ...sales.map((sale): Movement => ({
      id: sale.id,
      type: 'sale',
      amount: sale.cashAmount + sale.digitalAmount,
      description: sale.description,
      time: sale.createdAt,
      data: sale
    })),
    // Convertir retiros
    ...withdrawals.map((withdrawal): Movement => ({
      id: withdrawal.id,
      type: 'withdrawal',
      amount: withdrawal.amount,
      description: withdrawal.description || getReasonLabel(withdrawal.reason),
      time: withdrawal.createdAt,
      data: withdrawal
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const handleDelete = async (movement: Movement) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar ${movement.type === 'sale' ? 'esta venta' : 'este retiro'}?`)) {
      return;
    }

    try {
      setDeletingId(movement.id);
      const token = await getIdToken();
      if (!token) throw new Error('No hay token de autenticación');

      if (movement.type === 'sale') {
        await SalesService.deleteSale(movement.id, token);
      } else {
        await WithdrawalService.deleteWithdrawal(movement.id, token);
      }
      
      onMovementDeleted();
    } catch (error) {
      console.error('Error eliminando movimiento:', error);
      alert(`Error al eliminar ${movement.type === 'sale' ? 'la venta' : 'el retiro'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasonObj = WITHDRAWAL_REASONS.find(r => r.value === reason);
    return reasonObj?.label || reason;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodObj = PAYMENT_METHODS.find(m => m.value === method);
    return methodObj?.label || method;
  };

  // Función para obtener colores según el medio de pago
  const getPaymentMethodColor = (method: string) => {
    const colors = {
      'efectivo': { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600' },
      'transferencia': { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-600' },
      'tarjeta_debito': { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-600' },
      'tarjeta_credito': { bg: 'bg-red-100', text: 'text-red-700', icon: 'text-red-600' },
      'mercado_pago': { bg: 'bg-cyan-100', text: 'text-cyan-700', icon: 'text-cyan-600' },
      'otro': { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'text-gray-600' }
    };
    return colors[method as keyof typeof colors] || colors.otro;
  };

  // Función para obtener el ícono según el medio de pago
  const getPaymentMethodIcon = (method: string) => {
    if (method === 'efectivo') {
      return <DollarSign className="w-4 h-4" />;
    }
    return <CreditCard className="w-4 h-4" />;
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleGenerateReceipt = (movement: Movement) => {
    setSelectedMovement({
      type: movement.type,
      data: movement.data
    });
    setShowReceiptModal(true);
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return format(date, 'HH:mm', { locale: es });
    } catch {
      return '--:--';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay movimientos registrados</h3>
        <p className="text-gray-600">Las ventas y retiros que registres aparecerán aquí ordenados por hora</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Movimientos del día ({movements.length})
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded-full mr-2"></div>
              <span>Ventas ({sales.length})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-100 rounded-full mr-2"></div>
              <span>Retiros ({withdrawals.length})</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {movements.map((movement) => {
          const isWithdrawal = movement.type === 'withdrawal';
          const sale = !isWithdrawal ? movement.data as Sale : null;
          const paymentMethodColors = sale ? getPaymentMethodColor(sale.paymentMethod) : null;
          
          return (
            <div key={`${movement.type}-${movement.id}`} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {isWithdrawal ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100">
                            <Minus className="w-4 h-4 text-red-600" />
                          </div>
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentMethodColors?.bg}`}>
                            <span className={paymentMethodColors?.icon}>
                              {getPaymentMethodIcon(sale!.paymentMethod)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-lg font-semibold ${
                            isWithdrawal ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {isWithdrawal ? '-' : '+'}${movement.amount.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(movement.time)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {movement.description}
                          </p>
                          
                          {!isWithdrawal && sale && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${paymentMethodColors?.bg} ${paymentMethodColors?.text}`}>
                              {getPaymentMethodLabel(sale.paymentMethod)}
                            </span>
                          )}
                        </div>
                        
                        {!isWithdrawal && sale && (
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                            {sale.cashAmount > 0 && (
                              <span className="flex items-center">
                                <DollarSign className="w-3 h-3 mr-1 text-green-600" />
                                Efectivo: ${sale.cashAmount.toFixed(2)}
                              </span>
                            )}
                            {sale.digitalAmount > 0 && (
                              <span className="flex items-center">
                                <CreditCard className="w-3 h-3 mr-1 text-blue-600" />
                                Digital: ${sale.digitalAmount.toFixed(2)}
                              </span>
                            )}
                            {sale.commissionAmount > 0 && (
                              <span className="flex items-center">
                                <Calculator className="w-3 h-3 mr-1 text-red-600" />
                                Comisión: ${sale.commissionAmount.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleGenerateReceipt(movement)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Generar comprobante"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      
                      {((movement.type === 'sale' && (movement.data as Sale).description.length > 30) ||
                        (movement.type === 'withdrawal' && (movement.data as Withdrawal).description)) && (
                        <button
                          onClick={() => toggleExpanded(movement.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(movement)}
                        disabled={deletingId === movement.id}
                        className={`p-1 text-gray-400 hover:text-red-600 disabled:opacity-50`}
                        title={`Eliminar ${movement.type === 'sale' ? 'venta' : 'retiro'}`}
                      >
                        {deletingId === movement.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Detalles expandibles */}
                  {expandedId === movement.id && (
                    <div className="mt-3 ml-11 p-3 bg-gray-50 rounded-lg">
                      {movement.type === 'sale' ? (
                        <div className="space-y-1 text-sm text-gray-700">
                          <p><strong>Descripción:</strong> {(movement.data as Sale).description}</p>
                          <p><strong>Medio de pago:</strong> {getPaymentMethodLabel((movement.data as Sale).paymentMethod)}</p>
                          <div className="flex space-x-4">
                            <span><strong>Efectivo:</strong> ${(movement.data as Sale).cashAmount.toFixed(2)}</span>
                            <span><strong>Digital:</strong> ${(movement.data as Sale).digitalAmount.toFixed(2)}</span>
                            <span><strong>Comisión:</strong> ${(movement.data as Sale).commissionAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm text-gray-700">
                          <p><strong>Motivo:</strong> {getReasonLabel((movement.data as Withdrawal).reason)}</p>
                          {(movement.data as Withdrawal).description && (
                            <p><strong>Descripción:</strong> {(movement.data as Withdrawal).description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Receipt Modal */}
      {showReceiptModal && selectedMovement && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedMovement(null);
          }}
          type={selectedMovement.type}
          data={selectedMovement.data}
        />
      )}
    </div>
  );
};
