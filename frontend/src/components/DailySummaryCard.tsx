'use client';

import { DailySummary } from '@/types';
import { TrendingUp, DollarSign, CreditCard, Calculator, Target, Minus } from 'lucide-react';

interface DailySummaryCardProps {
  summary: DailySummary;
  loading: boolean;
}

export const DailySummaryCard = ({ summary, loading }: DailySummaryCardProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const cards = [
    {
      title: 'Efectivo',
      value: summary.totalCash,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Digital',
      value: summary.totalDigital,
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Comisiones',
      value: summary.totalCommissions,
      icon: Calculator,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Retiros',
      value: summary.totalWithdrawals || 0,
      icon: Minus,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Balance Final',
      value: summary.finalBalance || summary.totalNet,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(card.value)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <IconComponent className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Card adicional con cantidad de ventas y retiros */}
      <div className="md:col-span-2 lg:col-span-5 bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              Resumen del día
            </p>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {summary.salesCount}
                </p>
                <p className="text-sm text-gray-600">Ventas</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {summary.withdrawalsCount || 0}
                </p>
                <p className="text-sm text-gray-600">Retiros</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(summary.totalCash + summary.totalDigital)}
                </p>
                <p className="text-sm text-gray-600">Total Bruto</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-purple-600">
                  {formatCurrency(summary.totalNet)}
                </p>
                <p className="text-sm text-gray-600">Después de comisiones</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(summary.finalBalance || summary.totalNet)}
                </p>
                <p className="text-sm text-gray-600">Balance Final</p>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-full bg-gray-50">
            <TrendingUp className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
