import { firestore } from '../config/firebase';
import { AccountMovement, CreateAccountMovementData, AccountMovementFilters, Customer } from '../../../shared/types';
import { CustomerService } from './customerService';

export class AccountMovementService {
  private movementsCollection = firestore.collection('accountMovements');
  private customerService = new CustomerService();

  async createMovement(data: CreateAccountMovementData & { userId: string }): Promise<AccountMovement> {
    const now = new Date();
    
    // Obtener información del cliente
    const customer = await this.customerService.getCustomerById(data.customerId, data.userId);
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }

    // Calcular nuevo saldo
    const currentBalance = await this.getCustomerBalance(data.customerId, data.userId);
    const newBalance = currentBalance + data.amount;
    
    let movementDate: string;
    if (data.date) {
      movementDate = data.date;
    } else {
      const localDate = new Date();
      movementDate = localDate.toISOString().split('T')[0];
    }
    
    // Crear el objeto de datos eliminando campos undefined
    const movementData: Omit<AccountMovement, 'id'> = {
      customerId: data.customerId,
      customerName: customer.name,
      date: movementDate,
      description: data.description,
      amount: data.amount,
      balance: newBalance,
      type: data.type,
      userId: data.userId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // Solo agregar el campo code si tiene un valor válido
    if (data.code && data.code.trim() !== '') {
      (movementData as any).code = data.code;
    }

    const docRef = await this.movementsCollection.add(movementData);
    
    return {
      id: docRef.id,
      ...movementData,
      ...(data.code && data.code.trim() !== '' ? { code: data.code } : {})
    };
  }

  async getMovements(filters: AccountMovementFilters): Promise<AccountMovement[]> {
    let query = this.movementsCollection.where('userId', '==', filters.userId);
    
    if (filters.customerId) {
      query = query.where('customerId', '==', filters.customerId);
    }

    if (filters.type) {
      query = query.where('type', '==', filters.type);
    }

    const snapshot = await query.orderBy('date', 'desc').orderBy('createdAt', 'desc').get();
    
    let movements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AccountMovement));

    // Filtrar por fechas en memoria
    if (filters.startDate) {
      movements = movements.filter(movement => movement.date >= filters.startDate!);
    }

    if (filters.endDate) {
      movements = movements.filter(movement => movement.date <= filters.endDate!);
    }

    return movements;
  }

  async getMovementById(id: string, userId: string): Promise<AccountMovement | null> {
    const doc = await this.movementsCollection.doc(id).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<AccountMovement, 'id'>;
    
    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data
    };
  }

  async updateMovement(id: string, updates: Partial<CreateAccountMovementData>, userId: string): Promise<AccountMovement | null> {
    const existingMovement = await this.getMovementById(id, userId);
    
    if (!existingMovement) {
      return null;
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.code !== undefined) updateData.code = updates.code;
    if (updates.date !== undefined) updateData.date = updates.date;

    // Si cambia el monto, recalcular balance
    if (updates.amount !== undefined) {
      const difference = updates.amount - existingMovement.amount;
      updateData.amount = updates.amount;
      updateData.balance = existingMovement.balance + difference;
      
      // TODO: Actualizar balances de movimientos posteriores
      // Por simplicidad, por ahora solo actualizamos este movimiento
    }

    await this.movementsCollection.doc(id).update(updateData);

    return {
      ...existingMovement,
      ...updateData
    };
  }

  async deleteMovement(id: string, userId: string): Promise<boolean> {
    const existingMovement = await this.getMovementById(id, userId);
    
    if (!existingMovement) {
      return false;
    }

    // TODO: Recalcular balances de movimientos posteriores
    await this.movementsCollection.doc(id).delete();
    return true;
  }

  async getCustomerBalance(customerId: string, userId: string): Promise<number> {
    const movements = await this.getMovements({ customerId, userId });
    
    if (movements.length === 0) {
      return 0;
    }

    // El balance más reciente es el balance actual
    return movements[0].balance;
  }

  async getCustomerAccount(customerId: string, userId: string) {
    const customer = await this.customerService.getCustomerById(customerId, userId);
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }

    const movements = await this.getMovements({ customerId, userId });
    
    const totalSales = movements
      .filter(m => m.type === 'sale' && m.amount > 0)
      .reduce((sum, m) => sum + m.amount, 0);
    
    const totalPayments = movements
      .filter(m => m.type === 'payment' && m.amount < 0)
      .reduce((sum, m) => sum + Math.abs(m.amount), 0);

    const currentBalance = movements.length > 0 ? movements[0].balance : 0;

    return {
      customer,
      movements,
      currentBalance,
      totalSales,
      totalPayments
    };
  }

  async importMovements(customerId: string, movements: Array<{
    date: string;
    description: string;
    code?: string;
    amount: number;
    balance: number;
    type: 'sale' | 'payment' | 'adjustment';
  }>, userId: string): Promise<AccountMovement[]> {
    const customer = await this.customerService.getCustomerById(customerId, userId);
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }

    const createdMovements: AccountMovement[] = [];
    const now = new Date();

    // Ordenar movimientos por fecha
    const sortedMovements = movements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const movementData of sortedMovements) {
      // Crear el objeto de datos eliminando campos undefined
      const movement: Omit<AccountMovement, 'id'> = {
        customerId,
        customerName: customer.name,
        date: movementData.date,
        description: movementData.description,
        amount: movementData.amount,
        balance: movementData.balance,
        type: movementData.type,
        userId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      // Solo agregar el campo code si tiene un valor válido
      if (movementData.code && movementData.code.trim() !== '') {
        (movement as any).code = movementData.code;
      }

      const docRef = await this.movementsCollection.add(movement);
      createdMovements.push({
        id: docRef.id,
        ...movement,
        ...(movementData.code && movementData.code.trim() !== '' ? { code: movementData.code } : {})
      });
    }

    return createdMovements;
  }

  async importCustomerData(customerName: string, movements: Array<{
    fecha: string;
    descripcion: string;
    codigo?: string;
    precio: number;
    saldo: number;
  }>, userId: string): Promise<{ customer: Customer; movements: AccountMovement[] }> {
    // Buscar o crear cliente
    let customer;
    try {
      const customers = await this.customerService.getCustomers({ userId, name: customerName });
      customer = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
      
      if (!customer) {
        // Crear nuevo cliente
        customer = await this.customerService.createCustomer({
          name: customerName,
          email: '',
          phone: '',
          address: '',
          taxId: '',
          creditLimit: 0,
          notes: `Cliente importado desde Excel - ${new Date().toLocaleDateString()}`,
          userId
        });
      }
    } catch (error) {
      throw new Error(`Error al crear/buscar cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    // Procesar y ordenar movimientos por fecha
    const processedMovements = movements.map(movement => ({
      date: movement.fecha,
      description: movement.descripcion || 'Movimiento importado',
      code: movement.codigo,
      amount: Math.abs(parseFloat(String(movement.precio)) || 0),
      balance: parseFloat(String(movement.saldo)) || 0,
      type: (parseFloat(String(movement.precio)) || 0) > 0 ? 'sale' : 'payment' as 'sale' | 'payment' | 'adjustment'
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Importar movimientos
    const importedMovements = await this.importMovements(customer.id!, processedMovements, userId);

    return {
      customer,
      movements: importedMovements
    };
  }
}
