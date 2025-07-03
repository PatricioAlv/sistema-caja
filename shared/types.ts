// Tipos para las ventas
export interface Sale {
  id: string;
  date: string; // ISO string
  description: string;
  cashAmount: number;
  digitalAmount: number;
  commissionAmount: number;
  paymentMethod: PaymentMethod;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de medios de pago
export type PaymentMethod = 
  | 'efectivo'
  | 'transferencia'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'mercado_pago'
  | 'otro';

// Configuración de comisiones por medio de pago
export interface CommissionConfig {
  paymentMethod: PaymentMethod;
  percentage: number;
  fixedAmount?: number;
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
