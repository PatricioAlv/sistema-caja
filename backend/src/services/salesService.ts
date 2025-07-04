import { firestore } from '../config/firebase';
import { Sale, CreateSaleData, SalesFilters, PaymentMethod } from '../../../shared/types';
import { format, startOfDay, endOfDay } from 'date-fns';
import { CommissionService } from './commissionService';

export class SalesService {
  private salesCollection = firestore.collection('sales');

  private async calculateAmounts(
    userId: string, 
    amount: number, 
    paymentMethod: PaymentMethod,
    cardBrand?: string,
    installments?: number
  ) {
    const isDigital = paymentMethod !== 'efectivo';
    const commission = await CommissionService.calculateCommission(
      userId, 
      paymentMethod, 
      amount, 
      cardBrand as any, 
      installments
    );
    
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
    
    const amounts = await this.calculateAmounts(
      data.userId,
      data.amount, 
      data.paymentMethod,
      data.cardBrand,
      data.installments
    );
    
    const saleData: Omit<Sale, 'id'> = {
      date: saleDate,
      description: data.description,
      ...amounts,
      paymentMethod: data.paymentMethod,
      userId: data.userId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // Solo agregar cardBrand e installments si tienen valores definidos
    if (data.cardBrand !== undefined) {
      saleData.cardBrand = data.cardBrand;
    }
    if (data.installments !== undefined) {
      saleData.installments = data.installments;
    }

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

    if (updates.amount !== undefined || updates.paymentMethod || updates.cardBrand || updates.installments) {
      const amount = updates.amount ?? (existingSale.cashAmount + existingSale.digitalAmount);
      const paymentMethod = updates.paymentMethod ?? existingSale.paymentMethod;
      const cardBrand = updates.cardBrand ?? existingSale.cardBrand;
      const installments = updates.installments ?? existingSale.installments;
      
      const amounts = await this.calculateAmounts(
        userId, 
        amount, 
        paymentMethod,
        cardBrand,
        installments
      );
      Object.assign(updateData, amounts);
      updateData.paymentMethod = paymentMethod;
      
      // Solo agregar cardBrand e installments si tienen valores definidos
      if (cardBrand !== undefined) {
        updateData.cardBrand = cardBrand;
      }
      if (installments !== undefined) {
        updateData.installments = installments;
      }
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
