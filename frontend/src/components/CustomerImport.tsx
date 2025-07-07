'use client';

import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { ExcelImportService } from '@/services/excelImportService';
import { ImportCustomerData } from '@/types';

interface CustomerImportProps {
  onImport: (data: ImportCustomerData) => void;
  onClose: () => void;
}

export const CustomerImport: React.FC<CustomerImportProps> = ({ onImport, onClose }) => {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportCustomerData | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await ExcelImportService.importCustomerData(file);
      
      // Validar datos
      const validationErrors = ExcelImportService.validateImportData(data);
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. '));
        return;
      }
      
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleConfirmImport = () => {
    if (preview) {
      console.log('🔄 Iniciando importación:', {
        customerName: preview.customerName,
        movementsCount: preview.movements.length,
        sampleMovement: preview.movements[0]
      });
      onImport(preview);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Importar Cliente desde Excel</h2>
            <p className="text-gray-600 mt-1">Importa los datos de cuenta corriente de un cliente desde un archivo Excel</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Zona de carga */}
          {!preview && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Arrastra tu archivo Excel aquí o haz clic para seleccionar
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Formatos soportados: .xlsx, .xls
              </p>
              <p className="text-xs text-gray-400 mb-4">
                El archivo debe contener columnas: Fecha, Descripción, Código, Precio/Monto, Saldo
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 cursor-pointer inline-block transition-colors"
              >
                Seleccionar archivo
              </label>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Procesando archivo...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-700">Archivo procesado correctamente</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">Datos del Cliente:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>Nombre:</strong> {preview.customerName}</p>
                  <p><strong>Movimientos:</strong> {preview.movements.length}</p>
                  <p><strong>Total ventas:</strong> {formatCurrency(
                    preview.movements
                      .filter(m => m.precio > 0)
                      .reduce((sum, m) => sum + m.precio, 0)
                  )}</p>
                  <p><strong>Saldo final:</strong> {formatCurrency(
                    preview.movements.length > 0 ? 
                    preview.movements[preview.movements.length - 1].saldo : 0
                  )}</p>
                </div>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h4 className="font-medium text-gray-800">Vista previa (primeros 10 movimientos):</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-3 text-left font-medium text-gray-600">Fecha</th>
                        <th className="p-3 text-left font-medium text-gray-600">Descripción</th>
                        <th className="p-3 text-left font-medium text-gray-600">Código</th>
                        <th className="p-3 text-right font-medium text-gray-600">Precio</th>
                        <th className="p-3 text-right font-medium text-gray-600">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {preview.movements.slice(0, 10).map((movement, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="p-3 text-gray-900">{movement.fecha}</td>
                          <td className="p-3 text-gray-900 max-w-xs truncate" title={movement.descripcion}>
                            {movement.descripcion}
                          </td>
                          <td className="p-3 text-gray-600">{movement.codigo || '-'}</td>
                          <td className={`p-3 text-right font-medium ${
                            movement.precio >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(movement.precio)}
                          </td>
                          <td className={`p-3 text-right font-medium ${
                            movement.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(movement.saldo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.movements.length > 10 && (
                  <div className="p-3 bg-gray-50 text-center text-sm text-gray-600 border-t">
                    ... y {preview.movements.length - 10} movimientos más
                  </div>
                )}
              </div>

              {/* Botón para cambiar archivo */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setPreview(null);
                    setError(null);
                  }}
                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  Seleccionar otro archivo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          {preview && (
            <button
              onClick={handleConfirmImport}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Importar Cliente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
