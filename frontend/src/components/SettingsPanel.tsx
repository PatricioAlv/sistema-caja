'use client';

import { useState } from 'react';
import { 
  Settings, 
  Store, 
  Percent, 
  FileText, 
  X,
  ChevronRight
} from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onBusinessSettingsOpen: () => void;
  onCommissionSettingsOpen: () => void;
}

export default function SettingsPanel({ 
  isOpen, 
  onToggle, 
  onBusinessSettingsOpen, 
  onCommissionSettingsOpen 
}: SettingsPanelProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const settingsItems = [
    {
      id: 'business',
      icon: Store,
      label: 'Configuración del Negocio',
      description: 'Nombre, datos de contacto y configuración general',
      onClick: onBusinessSettingsOpen,
      color: 'text-blue-600'
    },
    {
      id: 'commissions',
      icon: Percent,
      label: 'Configuración de Comisiones',
      description: 'Porcentajes por medio de pago, marcas y cuotas',
      onClick: onCommissionSettingsOpen,
      color: 'text-green-600'
    },
    {
      id: 'reports',
      icon: FileText,
      label: 'Reportes y Cierre',
      description: 'Cierre de caja diario y reportes (Próximamente)',
      onClick: () => console.log('Reportes - Próximamente'),
      color: 'text-purple-600',
      disabled: true
    }
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Panel lateral */}
      <div 
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl transform transition-all duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: isOpen ? '360px' : '0px' }}
      >
        {/* Header del panel */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Configuración</h2>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Lista de configuraciones */}
        <div className="p-6 space-y-3">
          {settingsItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.disabled ? undefined : item.onClick}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                disabled={item.disabled}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  item.disabled 
                    ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60' 
                    : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-lg cursor-pointer hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${
                    item.disabled 
                      ? 'bg-gray-100 opacity-50' 
                      : item.id === 'business' 
                        ? 'bg-blue-50' 
                        : item.id === 'commissions' 
                          ? 'bg-green-50' 
                          : 'bg-purple-50'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${item.color} ${item.disabled ? 'opacity-50' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-semibold ${
                        item.disabled ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {item.label}
                      </h3>
                      {!item.disabled && (
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          hoveredItem === item.id ? 'transform translate-x-1 text-blue-500' : ''
                        }`} />
                      )}
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${
                      item.disabled ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer del panel */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p className="font-medium">Sistema de Gestión de Caja</p>
            <p className="mt-1">Versión 1.0.0 - Actualizado</p>
          </div>
        </div>
      </div>

      {/* Botón flotante para abrir el panel (cuando está cerrado) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-20 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 z-30"
          title="Abrir configuración"
        >
          <Settings className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
