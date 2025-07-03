import { firestore } from '../config/firebase';
import { Withdrawal, CreateWithdrawalData, WithdrawalFilters } from '../../../shared/types';
import { format } from 'date-fns';

export class WithdrawalService {
  private withdrawalsCollection = firestore.collection('withdrawals');

  async createWithdrawal(data: CreateWithdrawalData & { userId: string }): Promise<Withdrawal> {
    try {
      const now = new Date();
      let withdrawalDate: string;
      
      if (data.date) {
        // Si viene una fecha, usarla directamente sin convertir a Date
        withdrawalDate = data.date;
      } else {
        // Si no viene fecha, usar la fecha actual en formato local
        const localDate = new Date();
        withdrawalDate = format(localDate, 'yyyy-MM-dd');
      }
      
      const withdrawalData: Omit<Withdrawal, 'id'> = {
        amount: data.amount,
        reason: data.reason,
        description: data.description || '',
        date: withdrawalDate,
        userId: data.userId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      const docRef = await this.withdrawalsCollection.add(withdrawalData);
      
      return {
        id: docRef.id,
        ...withdrawalData
      };
    } catch (error) {
      console.error('Error creando retiro:', error);
      throw new Error('Error al crear el retiro');
    }
  }

  async getWithdrawals(filters: WithdrawalFilters): Promise<Withdrawal[]> {
    try {
      // Consulta simplificada para evitar índices compuestos
      let query = this.withdrawalsCollection.where('userId', '==', filters.userId);

      const snapshot = await query.get();
      let withdrawals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Withdrawal));

      // Filtrar en memoria para evitar índices compuestos
      if (filters.startDate) {
        withdrawals = withdrawals.filter(withdrawal => withdrawal.date >= filters.startDate!);
      }

      if (filters.endDate) {
        withdrawals = withdrawals.filter(withdrawal => withdrawal.date <= filters.endDate!);
      }

      if (filters.reason) {
        withdrawals = withdrawals.filter(withdrawal => withdrawal.reason === filters.reason);
      }

      // Ordenar por fecha descendente
      withdrawals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return withdrawals;
    } catch (error) {
      console.error('Error obteniendo retiros:', error);
      throw new Error('Error al obtener los retiros');
    }
  }

  async getWithdrawalById(id: string, userId: string): Promise<Withdrawal | null> {
    try {
      const doc = await this.withdrawalsCollection.doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as Omit<Withdrawal, 'id'>;
      
      // Verificar que el retiro pertenezca al usuario
      if (data.userId !== userId) {
        return null;
      }

      return {
        id: doc.id,
        ...data
      };
    } catch (error) {
      console.error('Error obteniendo retiro:', error);
      throw new Error('Error al obtener el retiro');
    }
  }

  async updateWithdrawal(id: string, updates: Partial<CreateWithdrawalData>, userId: string): Promise<Withdrawal | null> {
    try {
      const existingWithdrawal = await this.getWithdrawalById(id, userId);
      
      if (!existingWithdrawal) {
        return null;
      }

      const updateData: any = {
        updatedAt: new Date().toISOString()
      };

      if (updates.amount !== undefined) {
        updateData.amount = updates.amount;
      }

      if (updates.reason) {
        updateData.reason = updates.reason;
      }

      if (updates.description !== undefined) {
        updateData.description = updates.description;
      }

      if (updates.date) {
        // Usar la fecha directamente sin convertir a Date para evitar problemas de zona horaria
        updateData.date = updates.date;
      }

      await this.withdrawalsCollection.doc(id).update(updateData);

      return {
        ...existingWithdrawal,
        ...updateData
      };
    } catch (error) {
      console.error('Error actualizando retiro:', error);
      throw new Error('Error al actualizar el retiro');
    }
  }

  async deleteWithdrawal(id: string, userId: string): Promise<boolean> {
    try {
      const existingWithdrawal = await this.getWithdrawalById(id, userId);
      
      if (!existingWithdrawal) {
        return false;
      }

      await this.withdrawalsCollection.doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error eliminando retiro:', error);
      throw new Error('Error al eliminar el retiro');
    }
  }

  async getWithdrawalsByDateRange(startDate: string, endDate: string, userId: string): Promise<Withdrawal[]> {
    return this.getWithdrawals({
      startDate,
      endDate,
      userId
    });
  }
}
