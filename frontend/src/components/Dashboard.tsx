'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { SalesService } from '@/services/salesService';
import { WithdrawalService } from '@/services/withdrawalService';
import { Sale, DailySummary, Withdrawal } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  DollarSign, 
  Calendar, 
  LogOut, 
  Plus,
  Minus,
  FileText
} from 'lucide-react';
import { SaleForm } from './SaleForm';
import { WithdrawalForm } from './WithdrawalForm';
import { MovementsList } from './MovementsList';
import { DailySummaryCard } from './DailySummaryCard';
import { CommissionSettings } from './CommissionSettings';
import BusinessSettings from './BusinessSettings';
import Sidebar from './Sidebar';
import { DailyClosureModal } from './DailyClosureModal';
import { CustomerManagement } from './CustomerManagement';

export const Dashboard = () => {
  const { user, signOut, getIdToken } = useAuth();
  const { businessConfig, refreshBusinessConfig } = useBusiness();
  const [sales, setSales] = useState<Sale[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showCommissionSettings, setShowCommissionSettings] = useState(false);
  const [showBusinessSettings, setShowBusinessSettings] = useState(false);
  const [showDailyClosure, setShowDailyClosure] = useState(false);
  const [showCustomerManagement, setShowCustomerManagement] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      setLoading(true);
      
      // Cargar ventas del día seleccionado
      const salesData = await SalesService.getSales({
        startDate: selectedDate,
        endDate: selectedDate
      }, token);
      
      // Cargar retiros del día seleccionado
      const withdrawalsData = await WithdrawalService.getWithdrawals({
        startDate: selectedDate,
        endDate: selectedDate
      }, token);
      
      // Cargar resumen diario
      const summaryData = await SalesService.getDailySummary(selectedDate, token);
      
      setSales(salesData);
      setWithdrawals(withdrawalsData);
      setDailySummary(summaryData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, getIdToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaleCreated = () => {
    setShowSaleForm(false);
    loadData();
  };

  const handleWithdrawalCreated = () => {
    setShowWithdrawalForm(false);
    loadData();
  };


  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        onBusinessSettingsOpen={() => setShowBusinessSettings(true)}
        onCommissionSettingsOpen={() => setShowCommissionSettings(true)}
        onDailyClosureOpen={() => setShowDailyClosure(true)}
        onCustomerManagementOpen={() => setShowCustomerManagement(true)}
        onSidebarToggle={(expanded) => setSidebarExpanded(expanded)}
      />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${
        sidebarExpanded ? 'ml-64' : 'ml-16'
      } md:${sidebarExpanded ? 'ml-64' : 'ml-16'} ml-0`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {businessConfig?.businessName || 'Sistema de Caja'}
                  </h1>
                  {businessConfig?.businessName && (
                    <p className="text-sm text-gray-600">Sistema de Gestión</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-800 font-medium">
                  {user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Date Selector */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Calendar className="w-5 h-5 text-gray-700" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 font-medium"
              />
              <span className="text-gray-800 font-medium">
                {format(parseISO(selectedDate + 'T12:00:00'), 'EEEE, d MMMM yyyy', { locale: es })}
              </span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDailyClosure(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <FileText className="w-4 h-4 mr-2" />
                Cierre de Caja
              </button>
              <button
                onClick={() => setShowSaleForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Venta
              </button>
              <button
                onClick={() => setShowWithdrawalForm(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <Minus className="w-4 h-4 mr-2" />
                Nuevo Retiro
              </button>
            </div>
          </div>

          {/* Daily Summary */}
          {dailySummary && (
            <DailySummaryCard summary={dailySummary} loading={loading} />
          )}

          {/* Unified Movements List */}
          <div className="mt-8">
            <MovementsList 
              sales={sales}
              withdrawals={withdrawals}
              loading={loading} 
              onMovementDeleted={loadData}
            />
          </div>
        </main>
      </div>

      {/* Sale Form Modal */}
      {showSaleForm && (
        <SaleForm
          onClose={() => setShowSaleForm(false)}
          onSaleCreated={handleSaleCreated}
        />
      )}

      {/* Withdrawal Form Modal */}
      {showWithdrawalForm && (
        <WithdrawalForm
          onClose={() => setShowWithdrawalForm(false)}
          onWithdrawalCreated={handleWithdrawalCreated}
        />
      )}

      {/* Commission Settings Modal */}
      {showCommissionSettings && (
        <CommissionSettings
          onClose={() => setShowCommissionSettings(false)}
          onSaved={loadData}
        />
      )}

      {/* Business Settings Modal */}
      {showBusinessSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Configuración del Negocio</h3>
              <button
                onClick={() => setShowBusinessSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Cerrar</span>
                ×
              </button>
            </div>
            <BusinessSettings />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowBusinessSettings(false);
                  refreshBusinessConfig();
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Closure Modal */}
      {showDailyClosure && dailySummary && (
        <DailyClosureModal
          isOpen={showDailyClosure}
          onClose={() => setShowDailyClosure(false)}
          sales={sales}
          withdrawals={withdrawals}
          summary={dailySummary}
          selectedDate={selectedDate}
        />
      )}

      {/* Customer Management Modal */}
      {showCustomerManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Cuentas Corrientes</h2>
              <button
                onClick={() => setShowCustomerManagement(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <CustomerManagement />
          </div>
        </div>
      )}
    </div>
  );
};
