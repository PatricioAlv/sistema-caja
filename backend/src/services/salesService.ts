import { firestore } from '../config/firebase';
import { Sale, CreateSaleData, SalesFilters, PaymentMethod, CommissionConfig } from '../../../shared/types';
import { format, startOfDay, endOfDay } from 'date-fns';

export class SalesService {
  private salesCollection = firestore.collection('sales');

  // Configuración de comisiones por defecto
  private commissionConfigs: CommissionConfig[] = [
    { paymentMethod: 'efectivo', percentage: 0 },
    { paymentMethod: 'transferencia', percentage: 0 },
    { paymentMethod: 'tarjeta_debito', percentage: 2.5 },
    { paymentMethod: 'tarjeta_credito', percentage: 3.5 },
    { paymentMethod: 'mercado_pago', percentage: 4.5 },
    { paymentMethod: 'otro', percentage: 0 }
  ];

  private calculateCommission(amount: number, paymentMethod: PaymentMethod): number {
    const config = this.commissionConfigs.find(c => c.paymentMethod === paymentMethod);
    if (!config) return 0;
    
    const commission = (amount * config.percentage) / 100;
    return Math.round(commission * 100) / 100; // Redondear a 2 decimales
  }

  private calculateAmounts(amount: number, paymentMethod: PaymentMethod) {
    const isDigital = paymentMethod !== 'efectivo';
    const commission = this.calculateCommission(amount, paymentMethod);
    
    return {
      cashAmount: isDigital ? 0 : amount,
      digitalAmount: isDigital ? amount : 0,
      commissionAmount: commission
    };
  }

  async createSale(data: CreateSaleData & { userId: string }): Promise<Sale> {
    const now = new Date();
    let saleDate: string;
    
    if (data.date) {
      // Si viene una fecha, usarla directamente sin convertir a Date
      saleDate = data.date;
    } else {
      // Si no viene fecha, usar la fecha actual en formato local
      const localDate = new Date();
      saleDate = format(localDate, 'yyyy-MM-dd');
    }
    
    const amounts = this.calculateAmounts(data.amount, data.paymentMethod);
    
    const saleData: Omit<Sale, 'id'> = {
      date: saleDate,
      description: data.description,
      ...amounts,
      paymentMethod: data.paymentMethod,
      userId: data.userId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    const docRef = await this.salesCollection.add(saleData);
    
    return {
      id: docRef.id,
      ...saleData
    };
  }

  async getSales(filters: SalesFilters): Promise<Sale[]> {
    // Consulta simplificada para evitar índices compuestos
    let query = this.salesCollection.where('userId', '==', filters.userId);
    
    // Solo ordenar por fecha si no hay filtros adicionales
    if (!filters.startDate && !filters.endDate && !filters.paymentMethod) {
      query = query.orderBy('date', 'desc');
    }

    const snapshot = await query.get();
    
    let sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Sale));

    // Filtrar en memoria para evitar índices compuestos
    if (filters.startDate) {
      sales = sales.filter(sale => sale.date >= filters.startDate!);
    }

    if (filters.endDate) {
      sales = sales.filter(sale => sale.date <= filters.endDate!);
    }

    if (filters.paymentMethod) {
      sales = sales.filter(sale => sale.paymentMethod === filters.paymentMethod);
    }

    // Ordenar por fecha en memoria
    sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return sales;
  }

  async getSaleById(id: string, userId: string): Promise<Sale | null> {
    const doc = await this.salesCollection.doc(id).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Sale, 'id'>;
    
    // Verificar que la venta pertenezca al usuario
    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data
    };
  }

  async updateSale(id: string, updates: Partial<CreateSaleData>, userId: string): Promise<Sale | null> {
    const existingSale = await this.getSaleById(id, userId);
    
    if (!existingSale) {
      return null;
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (updates.description) {
      updateData.description = updates.description;
    }

    if (updates.amount !== undefined || updates.paymentMethod) {
      const amount = updates.amount ?? (existingSale.cashAmount + existingSale.digitalAmount);
      const paymentMethod = updates.paymentMethod ?? existingSale.paymentMethod;
      
      const amounts = this.calculateAmounts(amount, paymentMethod);
      Object.assign(updateData, amounts);
      updateData.paymentMethod = paymentMethod;
    }

    if (updates.date) {
      // Usar la fecha directamente sin convertir a Date para evitar problemas de zona horaria
      updateData.date = updates.date;
    }

    await this.salesCollection.doc(id).update(updateData);

    return {
      ...existingSale,
      ...updateData
    };
  }

  async deleteSale(id: string, userId: string): Promise<boolean> {
    const existingSale = await this.getSaleById(id, userId);
    
    if (!existingSale) {
      return false;
    }

    await this.salesCollection.doc(id).delete();
    return true;
  }

  async getSalesByDateRange(startDate: string, endDate: string, userId: string): Promise<Sale[]> {
    return this.getSales({
      startDate,
      endDate,
      userId
    });
  }
}
