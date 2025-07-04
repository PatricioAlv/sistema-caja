'use client';

import { useState } from 'react';
import { 
  FileText, 
  Download, 
  MessageCircle, 
  X, 
  User,
  Phone,
  Hash
} from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { ReceiptService, ReceiptData } from '@/services/receiptService';
import { Sale, Withdrawal } from '@/types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'sale' | 'withdrawal';
  data: Sale | Withdrawal;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  type,
  data
}) => {
  const { businessConfig } = useBusiness();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [receiptNumber, setReceiptNumber] = useState(() => ReceiptService.generateReceiptNumber());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    if (!businessConfig) {
      alert('No se ha configurado la información del negocio');
      return;
    }

    setIsGenerating(true);
    
    try {
      const receiptData: ReceiptData = {
        type,
        data,
        business: businessConfig,
        receiptNumber,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined
      };

      ReceiptService.downloadReceiptPDF(receiptData);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Inténtelo nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!businessConfig) {
      alert('No se ha configurado la información del negocio');
      return;
    }

    if (!customerPhone) {
      alert('Debe ingresar el número de teléfono del cliente para enviar por WhatsApp');
      return;
    }

    setIsSending(true);
    
    try {
      const receiptData: ReceiptData = {
        type,
        data,
        business: businessConfig,
        receiptNumber,
        customerName: customerName || undefined,
        customerPhone: customerPhone
      };

      await ReceiptService.sendToWhatsApp(receiptData);
      
      // Opcional: Cerrar el modal después de enviar
      // onClose();
    } catch (error) {
      console.error('Error enviando por WhatsApp:', error);
      alert('Error al enviar por WhatsApp. Inténtelo nuevamente.');
    } finally {
      setIsSending(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getOperationDetails = () => {
    if (type === 'sale') {
      const sale = data as Sale;
      const totalAmount = sale.cashAmount + sale.digitalAmount;
      return {
        title: 'Venta',
        description: sale.description,
        amount: totalAmount,
        commission: sale.commissionAmount,
        netAmount: totalAmount - sale.commissionAmount
      };
    } else {
      const withdrawal = data as Withdrawal;
      return {
        title: 'Retiro',
        description: withdrawal.reason,
        amount: withdrawal.amount,
        commission: 0,
        netAmount: withdrawal.amount
      };
    }
  };

  const operationDetails = getOperationDetails();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Generar Comprobante</h2>
                <p className="text-blue-100">{operationDetails.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Resumen de la operación */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumen de la Operación</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Descripción:</span>
                  <span className="font-medium">{operationDetails.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monto:</span>
                  <span className="font-medium">{formatCurrency(operationDetails.amount)}</span>
                </div>
                {operationDetails.commission > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Comisión:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(operationDetails.commission)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-semibold text-gray-900">Total:</span>
                  <span className="font-bold text-green-600">{formatCurrency(operationDetails.netAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Número de comprobante */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              Número de Comprobante
            </label>
            <input
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Número automático"
            />
          </div>

          {/* Datos del cliente */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Datos del Cliente (Opcional)</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Teléfono (para WhatsApp)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+54 9 11 1234-5678"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ingrese el número con código de país para enviar por WhatsApp
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
            
            <button
              onClick={handleSendWhatsApp}
              disabled={isSending || !customerPhone}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {isSending ? 'Enviando...' : 'Enviar por WhatsApp'}
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
