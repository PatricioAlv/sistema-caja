// Configuración del negocio
export interface BusinessConfig {
  id?: string;
  userId: string;
  businessName: string;
  ownerName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string; // URL del logo (opcional)
  description?: string;
  currency: string; // Moneda (ej: 'ARS', 'USD', 'EUR')
  timezone: string; // Zona horaria (ej: 'America/Argentina/Buenos_Aires')
  createdAt: string;
  updatedAt: string;
}

// Tipos para las ventas
export interface Sale {
  id: string;
  date: string; // ISO string
  description: string;
  cashAmount: number;
  digitalAmount: number;
  commissionAmount: number;
  paymentMethod: PaymentMethod;
  cardBrand?: CardBrand; // Para tarjetas de crédito
  installments?: number; // Cantidad de cuotas (1, 3, 6, 12)
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de medios de pago
export type PaymentMethod = 
  | 'efectivo'
  | 'transferencia'
  | 'qr'
  | 'tarjeta_debito'
  | 'tarjeta_credito';

// Marcas de tarjetas de crédito
export type CardBrand = 
  | 'visa'
  | 'mastercard'
  | 'naranja'
  | 'tuya';

// Configuración de comisiones
export interface CommissionConfig {
  id?: string;
  userId: string;
  paymentMethod: PaymentMethod;
  cardBrand?: CardBrand; // Solo para tarjetas de crédito
  installments?: number; // Solo para tarjetas de crédito (1, 3, 6, 12)
  percentage: number;
  fixedAmount?: number; // Comisión fija adicional (opcional)
  isActive: boolean;
  updatedAt: string;
}

// Configuración predeterminada de comisiones
export interface DefaultCommissions {
  efectivo: number;
  transferencia: number;
  qr: number;
  tarjeta_debito: number;
  tarjeta_credito: {
    visa: { [key: number]: number }; // { 1: 2.8, 3: 3.2, 6: 3.5, 12: 4.0 }
    mastercard: { [key: number]: number };
    naranja: { [key: number]: number };
    tuya: { [key: number]: number };
  };
}

// Resumen diario
export interface DailySummary {
  date: string;
  totalCash: number;
  totalDigital: number;
  totalCommissions: number;
  totalNet: number; // Total después de comisiones
  salesCount: number;
  totalWithdrawals: number; // Total de retiros
  withdrawalsCount: number; // Cantidad de retiros
  finalBalance: number; // Balance final (totalNet - totalWithdrawals)
}

// Datos para crear una nueva venta
export interface CreateSaleData {
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  cardBrand?: CardBrand; // Requerido para tarjetas de crédito
  installments?: number; // Requerido para tarjetas de crédito
  date?: string; // Opcional, por defecto fecha actual
}

// Respuesta de la API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Filtros para búsqueda de ventas
export interface SalesFilters {
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod;
  userId?: string;
}

// Usuario
export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
}

// Tipos para retiros de efectivo
export interface Withdrawal {
  id: string;
  amount: number;
  reason: WithdrawalReason;
  description?: string;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWithdrawalData {
  amount: number;
  reason: WithdrawalReason;
  description?: string;
  date?: string; // Opcional, por defecto fecha actual
}

export interface WithdrawalFilters {
  startDate?: string;
  endDate?: string;
  reason?: WithdrawalReason;
  userId?: string;
}

export type WithdrawalReason = 
  | 'gastos_operativos'
  | 'pago_proveedores'
  | 'salarios'
  | 'servicios'
  | 'impuestos'
  | 'personal'
  | 'otros';

export const WITHDRAWAL_REASONS: { value: WithdrawalReason; label: string }[] = [
  { value: 'gastos_operativos', label: 'Gastos Operativos' },
  { value: 'pago_proveedores', label: 'Pago a Proveedores' },
  { value: 'salarios', label: 'Salarios' },
  { value: 'servicios', label: 'Servicios (luz, agua, etc.)' },
  { value: 'impuestos', label: 'Impuestos' },
  { value: 'personal', label: 'Gastos Personales' },
  { value: 'otros', label: 'Otros' }
];

// Opciones de medios de pago para el frontend
export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'qr', label: 'QR (Modo, CVU)' },
  { value: 'tarjeta_debito', label: 'Tarjeta de Débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
];

// Marcas de tarjetas de crédito
export const CARD_BRANDS: { value: CardBrand; label: string }[] = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'naranja', label: 'Naranja' },
  { value: 'tuya', label: 'Tuya' },
];

// Opciones de cuotas
export const INSTALLMENT_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1 cuota' },
  { value: 3, label: '3 cuotas' },
  { value: 6, label: '6 cuotas' },
  { value: 12, label: '12 cuotas' },
];

// Configuración predeterminada de comisiones (valores promedio Argentina 2024)
export const DEFAULT_COMMISSIONS: DefaultCommissions = {
  efectivo: 0,
  transferencia: 0,
  qr: 1.2,
  tarjeta_debito: 2.0,
  tarjeta_credito: {
    visa: { 1: 2.8, 3: 3.2, 6: 3.5, 12: 4.0 },
    mastercard: { 1: 2.8, 3: 3.2, 6: 3.5, 12: 4.0 },
    naranja: { 1: 3.5, 3: 4.0, 6: 4.5, 12: 5.0 },
    tuya: { 1: 3.0, 3: 3.5, 6: 4.0, 12: 4.5 },
  },
};
