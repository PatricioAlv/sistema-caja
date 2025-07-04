'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  FileText, 
  Download, 
  X, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  User
} from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { PDFService, DailyClosure } from '@/services/pdfService';
import { Sale, Withdrawal, DailySummary } from '@/types';

interface DailyClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  withdrawals: Withdrawal[];
  summary: DailySummary;
  selectedDate: string;
}

export const DailyClosureModal: React.FC<DailyClosureModalProps> = ({
  isOpen,
  onClose,
  sales,
  withdrawals,
  summary,
  selectedDate
}) => {
  const { businessConfig } = useBusiness();
  const [isGenerating, setIsGenerating] = useState(false);
  const [responsiblePerson, setResponsiblePerson] = useState('');

  if (!isOpen) return null;

  const handleGeneratePDF = async () => {
    if (!businessConfig) {
      alert('No se ha configurado la información del negocio');
      return;
    }

    setIsGenerating(true);
    
    try {
      const closure: DailyClosure = {
        date: selectedDate,
        sales,
        withdrawals,
        summary,
        business: businessConfig,
        closingTime: format(new Date(), 'HH:mm', { locale: es }),
        responsiblePerson: responsiblePerson || 'No especificado'
      };

      PDFService.generateDailyClosurePDF(closure);
      
      // Opcional: Cerrar el modal después de generar el PDF
      // onClose();
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Inténtelo nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDateLong = (date: string) => {
    return format(new Date(date), 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: es });
  };

  const totalSales = summary.totalCash + summary.totalDigital;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Cierre de Caja Diario</h2>
                <p className="text-blue-100">{formatDateLong(selectedDate)}</p>
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
          {/* Información del negocio */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Negocio</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Negocio:</p>
                  <p className="font-medium">{businessConfig?.businessName || 'No especificado'}</p>
                </div>
                {businessConfig?.address && (
                  <div>
                    <p className="text-sm text-gray-600">Dirección:</p>
                    <p className="font-medium">{businessConfig.address}</p>
                  </div>
                )}
                {businessConfig?.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Teléfono:</p>
                    <p className="font-medium">{businessConfig.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Fecha de cierre:</p>
                  <p className="font-medium">{format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen general */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumen General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Total Ventas</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(totalSales)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">Total Retiros</p>
                    <p className="text-2xl font-bold text-red-900">{formatCurrency(summary.totalWithdrawals)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Total Comisiones</p>
                    <p className="text-2xl font-bold text-orange-900">{formatCurrency(summary.totalCommissions)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Balance Final</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(summary.finalBalance)}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas adicionales */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Estadísticas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cantidad de Ventas</p>
                    <p className="text-xl font-bold text-gray-900">{summary.salesCount}</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cantidad de Retiros</p>
                    <p className="text-xl font-bold text-gray-900">{summary.withdrawalsCount}</p>
                  </div>
                  <TrendingDown className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Promedio por Venta</p>
                    <p className="text-xl font-bold text-gray-900">
                      {summary.salesCount > 0 ? formatCurrency(totalSales / summary.salesCount) : formatCurrency(0)}
                    </p>
                  </div>
                  <DollarSign className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Responsable del cierre */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Responsable del Cierre</h3>
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-600" />
              <input
                type="text"
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                placeholder="Nombre del responsable (opcional)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generando PDF...' : 'Generar PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
