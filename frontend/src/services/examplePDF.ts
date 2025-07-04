import { PDFService, DailyClosure } from './pdfService';
import { Sale, Withdrawal, DailySummary, BusinessConfig } from '@/types';

// Datos de ejemplo para demostrar el cierre de caja
export const generateExamplePDF = () => {
  const exampleBusiness: BusinessConfig = {
    userId: 'test-user',
    businessName: 'Kiosco Don Juan',
    ownerName: 'Juan Pérez',
    address: 'Av. Corrientes 1234, Buenos Aires',
    phone: '+54 11 1234-5678',
    email: 'juan@kioscodonjouan.com',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const exampleSales: Sale[] = [
    {
      id: '1',
      date: '2025-07-03',
      description: 'Coca Cola 500ml',
      cashAmount: 0,
      digitalAmount: 800,
      commissionAmount: 16,
      paymentMethod: 'qr',
      userId: 'test-user',
      createdAt: '2025-07-03T09:30:00Z',
      updatedAt: '2025-07-03T09:30:00Z'
    },
    {
      id: '2',
      date: '2025-07-03',
      description: 'Alfajor Havanna',
      cashAmount: 650,
      digitalAmount: 0,
      commissionAmount: 0,
      paymentMethod: 'efectivo',
      userId: 'test-user',
      createdAt: '2025-07-03T10:15:00Z',
      updatedAt: '2025-07-03T10:15:00Z'
    },
    {
      id: '3',
      date: '2025-07-03',
      description: 'Cigarrillos Philip Morris',
      cashAmount: 0,
      digitalAmount: 2500,
      commissionAmount: 70,
      paymentMethod: 'tarjeta_credito',
      cardBrand: 'visa',
      installments: 3,
      userId: 'test-user',
      createdAt: '2025-07-03T11:45:00Z',
      updatedAt: '2025-07-03T11:45:00Z'
    },
    {
      id: '4',
      date: '2025-07-03',
      description: 'Carga de SUBE',
      cashAmount: 0,
      digitalAmount: 1000,
      commissionAmount: 20,
      paymentMethod: 'transferencia',
      userId: 'test-user',
      createdAt: '2025-07-03T14:20:00Z',
      updatedAt: '2025-07-03T14:20:00Z'
    }
  ];

  const exampleWithdrawals: Withdrawal[] = [
    {
      id: '1',
      amount: 500,
      reason: 'gastos_operativos',
      description: 'Compra de mercadería',
      date: '2025-07-03',
      userId: 'test-user',
      createdAt: '2025-07-03T12:00:00Z',
      updatedAt: '2025-07-03T12:00:00Z'
    },
    {
      id: '2',
      amount: 300,
      reason: 'personal',
      description: 'Efectivo personal',
      date: '2025-07-03',
      userId: 'test-user',
      createdAt: '2025-07-03T16:30:00Z',
      updatedAt: '2025-07-03T16:30:00Z'
    }
  ];

  const exampleSummary: DailySummary = {
    date: '2025-07-03',
    totalCash: 650,
    totalDigital: 4300,
    totalCommissions: 106,
    totalNet: 4844,
    salesCount: 4,
    totalWithdrawals: 800,
    withdrawalsCount: 2,
    finalBalance: 4044
  };

  const exampleClosure: DailyClosure = {
    date: '2025-07-03',
    sales: exampleSales,
    withdrawals: exampleWithdrawals,
    summary: exampleSummary,
    business: exampleBusiness,
    openingTime: '08:00',
    closingTime: '18:00',
    responsiblePerson: 'Juan Pérez'
  };

  PDFService.generateDailyClosurePDF(exampleClosure);
};
