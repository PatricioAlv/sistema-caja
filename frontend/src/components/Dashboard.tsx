'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  Minus
} from 'lucide-react';
import { SaleForm } from './SaleForm';
import { WithdrawalForm } from './WithdrawalForm';
import { MovementsList } from './MovementsList';
import { DailySummaryCard } from './DailySummaryCard';

export const Dashboard = () => {
  const { user, signOut, getIdToken } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Sistema de Caja</h1>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    </div>
  );
};
