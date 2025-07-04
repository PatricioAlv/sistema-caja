import { ReceiptService } from '@/services/receiptService';
import { Sale, Withdrawal, BusinessConfig } from '@/types';

// Datos de ejemplo para demostrar los comprobantes
export const generateExampleReceipts = () => {
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

  // Ejemplo de venta
  const exampleSale: Sale = {
    id: '1',
    date: '2025-07-04',
    description: 'Coca Cola 500ml + Alfajor Havanna',
    cashAmount: 0,
    digitalAmount: 1450,
    commissionAmount: 29,
    paymentMethod: 'qr',
    userId: 'test-user',
    createdAt: '2025-07-04T14:30:00Z',
    updatedAt: '2025-07-04T14:30:00Z'
  };

  // Ejemplo de retiro
  const exampleWithdrawal: Withdrawal = {
    id: '2',
    amount: 500,
    reason: 'gastos_operativos',
    description: 'Compra de mercadería para el kiosco',
    date: '2025-07-04',
    userId: 'test-user',
    createdAt: '2025-07-04T12:00:00Z',
    updatedAt: '2025-07-04T12:00:00Z'
  };

  // Generar comprobante de venta
  const saleReceiptData = {
    type: 'sale' as const,
    data: exampleSale,
    business: exampleBusiness,
    receiptNumber: ReceiptService.generateReceiptNumber(),
    customerName: 'María García',
    customerPhone: '+54 9 11 2345-6789'
  };

  // Generar comprobante de retiro
  const withdrawalReceiptData = {
    type: 'withdrawal' as const,
    data: exampleWithdrawal,
    business: exampleBusiness,
    receiptNumber: ReceiptService.generateReceiptNumber(),
    customerName: 'Juan Pérez (Propietario)',
    customerPhone: '+54 11 1234-5678'
  };

  console.log('Generando comprobante de venta de ejemplo...');
  ReceiptService.downloadReceiptPDF(saleReceiptData);

  setTimeout(() => {
    console.log('Generando comprobante de retiro de ejemplo...');
    ReceiptService.downloadReceiptPDF(withdrawalReceiptData);
  }, 1000);

  console.log('Ejemplos de comprobantes generados!');
};
