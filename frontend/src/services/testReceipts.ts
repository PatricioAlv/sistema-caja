import { ReceiptService } from '@/services/receiptService';
import { Sale, Withdrawal, BusinessConfig } from '@/types';

// Script de prueba para generar comprobantes desde la consola
export const testReceiptGeneration = () => {
  console.log('🧾 Iniciando prueba de generación de comprobantes...');

  const testBusiness: BusinessConfig = {
    userId: 'test-user',
    businessName: 'Kiosco El Sol',
    ownerName: 'María González',
    address: 'Av. San Martín 567, Buenos Aires',
    phone: '+54 11 9876-5432',
    email: 'maria@kioscosol.com',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Test 1: Venta con tarjeta de crédito
  const saleExample: Sale = {
    id: 'test-sale-1',
    date: '2025-07-04',
    description: 'Gaseosa Coca Cola 600ml + Snack Doritos + Chicles Beldent',
    cashAmount: 0,
    digitalAmount: 2350,
    commissionAmount: 82.25,
    paymentMethod: 'tarjeta_credito',
    cardBrand: 'visa',
    installments: 3,
    userId: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Test 2: Retiro de efectivo
  const withdrawalExample: Withdrawal = {
    id: 'test-withdrawal-1',
    amount: 15000,
    reason: 'pago_proveedores',
    description: 'Pago a proveedor de mercadería - Factura N° 0001-00123456',
    date: '2025-07-04',
    userId: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Generar comprobante de venta
  const saleReceiptData = {
    type: 'sale' as const,
    data: saleExample,
    business: testBusiness,
    receiptNumber: ReceiptService.generateReceiptNumber(),
    customerName: 'Carlos Rodríguez',
    customerPhone: '+54 9 11 3456-7890'
  };

  // Generar comprobante de retiro
  const withdrawalReceiptData = {
    type: 'withdrawal' as const,
    data: withdrawalExample,
    business: testBusiness,
    receiptNumber: ReceiptService.generateReceiptNumber(),
    customerName: 'María González (Propietaria)',
    customerPhone: '+54 11 9876-5432'
  };

  console.log('📄 Generando comprobante de venta...');
  ReceiptService.downloadReceiptPDF(saleReceiptData);

  setTimeout(() => {
    console.log('📄 Generando comprobante de retiro...');
    ReceiptService.downloadReceiptPDF(withdrawalReceiptData);
  }, 1500);

  setTimeout(() => {
    console.log('📱 Simulando envío por WhatsApp (venta)...');
    console.log('Para probar WhatsApp, ejecuta:');
    console.log('ReceiptService.sendToWhatsApp(saleReceiptData)');
  }, 3000);

  console.log('✅ Prueba completada! Revisa las descargas de PDF.');
  
  return {
    saleReceiptData,
    withdrawalReceiptData,
    testBusiness
  };
};

// Función para probar WhatsApp específicamente
export const testWhatsAppSend = () => {
  const { saleReceiptData } = testReceiptGeneration();
  
  console.log('📱 Enviando comprobante por WhatsApp...');
  ReceiptService.sendToWhatsApp(saleReceiptData);
};

// Hacer disponible globalmente para pruebas
if (typeof window !== 'undefined') {
  (window as Window & typeof globalThis & {
    testReceipts: typeof testReceiptGeneration;
    testWhatsApp: typeof testWhatsAppSend;
  }).testReceipts = testReceiptGeneration;
  
  (window as Window & typeof globalThis & {
    testReceipts: typeof testReceiptGeneration;
    testWhatsApp: typeof testWhatsAppSend;
  }).testWhatsApp = testWhatsAppSend;
}

export default testReceiptGeneration;
