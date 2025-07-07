'use client';

import { useState, useEffect } from 'react';
import { 
  Store, 
  Percent, 
  Home,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Users,
  Menu,
  X,
  FileText,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  onBusinessSettingsOpen: () => void;
  onCommissionSettingsOpen: () => void;
  onDailyClosureOpen?: () => void;
  onCustomerManagementOpen?: () => void;
  onSidebarToggle?: (isExpanded: boolean) => void;
}

export default function Sidebar({ 
  onBusinessSettingsOpen, 
  onCommissionSettingsOpen,
  onDailyClosureOpen,
  onCustomerManagementOpen,
  onSidebarToggle 
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Detectar si es mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Notificar cambios de expansión al Dashboard
  useEffect(() => {
    if (onSidebarToggle) {
      onSidebarToggle(isExpanded && !isMobile);
    }
  }, [isExpanded, isMobile, onSidebarToggle]);

  const handleToggle = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      icon: Home,
      label: 'Dashboard',
      onClick: () => console.log('Dashboard'),
      active: true,
      color: 'text-blue-600'
    },
    {
      id: 'sales',
      icon: DollarSign,
      label: 'Ventas',
      onClick: () => console.log('Ventas'),
      active: false,
      color: 'text-green-600'
    },
    {
      id: 'business',
      icon: Store,
      label: 'Negocio',
      onClick: () => {
        onBusinessSettingsOpen();
        closeMobileSidebar();
      },
      active: false,
      color: 'text-purple-600'
    },
    {
      id: 'commissions',
      icon: Percent,
      label: 'Comisiones',
      onClick: () => {
        onCommissionSettingsOpen();
        closeMobileSidebar();
      },
      active: false,
      color: 'text-orange-600'
    },
    {
      id: 'daily-closure',
      icon: FileText,
      label: 'Cierre de Caja',
      onClick: () => {
        onDailyClosureOpen?.();
        closeMobileSidebar();
      },
      active: false,
      color: 'text-purple-600'
    },
    {
      id: 'customers',
      icon: CreditCard,
      label: 'Cuentas Corrientes',
      onClick: () => {
        onCustomerManagementOpen?.();
        closeMobileSidebar();
      },
      active: false,
      color: 'text-indigo-600'
    },
    {
      id: 'users',
      icon: Users,
      label: 'Usuarios',
      onClick: () => console.log('Usuarios - Próximamente'),
      active: false,
      disabled: true,
      color: 'text-teal-600'
    }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={handleToggle}
          className="fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar Desktop */}
      {!isMobile && (
        <div 
          className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out z-40 ${
            isExpanded ? 'w-64' : 'w-16'
          }`}
        >
          {/* Header del sidebar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 w-full">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex-shrink-0 shadow-sm">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className={`transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
                <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">SistemaCaja</h1>
                <p className="text-xs text-gray-500 whitespace-nowrap">Gestión Inteligente</p>
              </div>
            </div>
            
            {/* Toggle Button */}
            <button
              onClick={handleToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

          {/* Navegación */}
          <nav className="py-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={item.disabled ? undefined : item.onClick}
                      disabled={item.disabled}
                      className={`w-full flex items-center px-4 py-3 text-left transition-all duration-200 group rounded-lg mx-2 ${
                        item.active
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : item.disabled
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={!isExpanded ? item.label : undefined}
                    >
                      <div className={`flex-shrink-0 ${
                        item.active 
                          ? 'text-blue-700' 
                          : item.disabled 
                            ? 'text-gray-400' 
                            : `${item.color || 'text-gray-500'} group-hover:text-gray-700`
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <span className={`transition-all duration-300 text-sm font-medium ${
                        isExpanded ? 'opacity-100 w-auto ml-3' : 'opacity-0 w-0 ml-0 overflow-hidden'
                      } ${item.disabled ? 'opacity-50' : ''}`}>
                        {item.label}
                      </span>
                      
                      {item.disabled && isExpanded && (
                        <span className={`transition-all duration-300 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full ml-auto ${
                          isExpanded ? 'opacity-100' : 'opacity-0'
                        }`}>
                          Próximo
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer del sidebar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className={`transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              {isExpanded ? (
                <div className="text-xs text-gray-500">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Sistema activo</span>
                  </div>
                  <p className="font-medium">v1.0.0</p>
                  <p className="text-gray-400">Sistema de Caja</p>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full" title="Sistema activo"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Mobile */}
      {isMobile && (
        <div
          className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-45 transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header del sidebar móvil */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">SistemaCaja</h1>
                <p className="text-xs text-gray-500">Gestión Inteligente</p>
              </div>
            </div>
            <button
              onClick={closeMobileSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navegación móvil */}
          <nav className="py-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={item.disabled ? undefined : item.onClick}
                      disabled={item.disabled}
                      className={`w-full flex items-center px-4 py-3 text-left transition-all duration-200 rounded-lg mx-2 ${
                        item.active
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : item.disabled
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className={`flex-shrink-0 mr-3 ${
                        item.active 
                          ? 'text-blue-700' 
                          : item.disabled 
                            ? 'text-gray-400' 
                            : item.color || 'text-gray-500'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <span className={`text-sm font-medium ${item.disabled ? 'opacity-50' : ''}`}>
                        {item.label}
                      </span>
                      
                      {item.disabled && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full ml-auto">
                          Próximo
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer móvil */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Sistema activo</span>
              </div>
              <p className="font-medium">v1.0.0</p>
              <p className="text-gray-400">Sistema de Caja</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
