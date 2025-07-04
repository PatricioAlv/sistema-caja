import { firestore } from '../config/firebase';
import { CommissionConfig, PaymentMethod, CardBrand, DEFAULT_COMMISSIONS } from '../../../shared/types';

export class CommissionService {
  private static collection = 'commissions';

  // Obtener configuraciones de comisiones de un usuario
  static async getCommissions(userId: string): Promise<CommissionConfig[]> {
    try {
      const snapshot = await firestore
        .collection(this.collection)
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CommissionConfig));
    } catch (error) {
      console.error('Error obteniendo configuraciones de comisiones:', error);
      throw new Error('Error al obtener configuraciones de comisiones');
    }
  }

  // Crear configuraciones predeterminadas para un nuevo usuario
  static async createDefaultCommissions(userId: string): Promise<CommissionConfig[]> {
    try {
      const batch = firestore.batch();
      const commissions: CommissionConfig[] = [];
      const now = new Date().toISOString();

      // Efectivo
      const efectivoConfig: CommissionConfig = {
        userId,
        paymentMethod: 'efectivo',
        percentage: DEFAULT_COMMISSIONS.efectivo,
        isActive: true,
        updatedAt: now
      };
      const efectivoRef = firestore.collection(this.collection).doc();
      batch.set(efectivoRef, efectivoConfig);
      commissions.push({ ...efectivoConfig, id: efectivoRef.id });

      // Transferencia
      const transferenciaConfig: CommissionConfig = {
        userId,
        paymentMethod: 'transferencia',
        percentage: DEFAULT_COMMISSIONS.transferencia,
        isActive: true,
        updatedAt: now
      };
      const transferenciaRef = firestore.collection(this.collection).doc();
      batch.set(transferenciaRef, transferenciaConfig);
      commissions.push({ ...transferenciaConfig, id: transferenciaRef.id });

      // QR
      const qrConfig: CommissionConfig = {
        userId,
        paymentMethod: 'qr',
        percentage: DEFAULT_COMMISSIONS.qr,
        isActive: true,
        updatedAt: now
      };
      const qrRef = firestore.collection(this.collection).doc();
      batch.set(qrRef, qrConfig);
      commissions.push({ ...qrConfig, id: qrRef.id });

      // Tarjeta de débito
      const debitoConfig: CommissionConfig = {
        userId,
        paymentMethod: 'tarjeta_debito',
        percentage: DEFAULT_COMMISSIONS.tarjeta_debito,
        isActive: true,
        updatedAt: now
      };
      const debitoRef = firestore.collection(this.collection).doc();
      batch.set(debitoRef, debitoConfig);
      commissions.push({ ...debitoConfig, id: debitoRef.id });

      // Tarjetas de crédito (todas las marcas y cuotas)
      const brands: CardBrand[] = ['visa', 'mastercard', 'naranja', 'tuya'];
      const installments = [1, 3, 6, 12];

      for (const brand of brands) {
        for (const installment of installments) {
          const creditConfig: CommissionConfig = {
            userId,
            paymentMethod: 'tarjeta_credito',
            cardBrand: brand,
            installments: installment,
            percentage: DEFAULT_COMMISSIONS.tarjeta_credito[brand][installment],
            isActive: true,
            updatedAt: now
          };
          const creditRef = firestore.collection(this.collection).doc();
          batch.set(creditRef, creditConfig);
          commissions.push({ ...creditConfig, id: creditRef.id });
        }
      }

      await batch.commit();
      return commissions;
    } catch (error) {
      console.error('Error creando configuraciones predeterminadas:', error);
      throw new Error('Error al crear configuraciones predeterminadas');
    }
  }

  // Actualizar una configuración de comisión
  static async updateCommission(
    commissionId: string,
    updates: Partial<CommissionConfig>,
    userId: string
  ): Promise<CommissionConfig> {
    try {
      const docRef = firestore.collection(this.collection).doc(commissionId);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Configuración de comisión no encontrada');
      }

      const currentData = doc.data() as CommissionConfig;
      if (currentData.userId !== userId) {
        throw new Error('No autorizado para modificar esta configuración');
      }

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await docRef.update(updatedData);

      const updatedDoc = await docRef.get();
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as CommissionConfig;
    } catch (error) {
      console.error('Error actualizando configuración de comisión:', error);
      throw new Error('Error al actualizar configuración de comisión');
    }
  }

  // Calcular comisión basada en las configuraciones del usuario
  static async calculateCommission(
    userId: string,
    paymentMethod: PaymentMethod,
    amount: number,
    cardBrand?: CardBrand,
    installments?: number
  ): Promise<number> {
    try {
      let query = firestore
        .collection(this.collection)
        .where('userId', '==', userId)
        .where('paymentMethod', '==', paymentMethod)
        .where('isActive', '==', true);

      if (paymentMethod === 'tarjeta_credito' && cardBrand && installments) {
        query = query
          .where('cardBrand', '==', cardBrand)
          .where('installments', '==', installments);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        // Si no hay configuración, crear configuraciones predeterminadas
        await this.createDefaultCommissions(userId);
        
        // Usar valores predeterminados
        if (paymentMethod === 'tarjeta_credito' && cardBrand && installments) {
          const percentage = DEFAULT_COMMISSIONS.tarjeta_credito[cardBrand]?.[installments] || 0;
          return (amount * percentage) / 100;
        } else {
          const percentage = DEFAULT_COMMISSIONS[paymentMethod as keyof typeof DEFAULT_COMMISSIONS];
          return typeof percentage === 'number' ? (amount * percentage) / 100 : 0;
        }
      }

      const config = snapshot.docs[0].data() as CommissionConfig;
      const commissionAmount = (amount * config.percentage) / 100;
      
      return commissionAmount + (config.fixedAmount || 0);
    } catch (error) {
      console.error('Error calculando comisión:', error);
      return 0; // En caso de error, no aplicar comisión
    }
  }

  // Obtener todas las configuraciones organizadas por tipo
  static async getOrganizedCommissions(userId: string) {
    try {
      const commissions = await this.getCommissions(userId);
      
      const organized = {
        efectivo: 0,
        transferencia: 0,
        qr: 0,
        tarjeta_debito: 0,
        tarjeta_credito: {
          visa: {} as { [key: number]: number },
          mastercard: {} as { [key: number]: number },
          naranja: {} as { [key: number]: number },
          tuya: {} as { [key: number]: number },
        }
      };

      commissions.forEach(config => {
        if (config.paymentMethod === 'tarjeta_credito' && config.cardBrand && config.installments) {
          organized.tarjeta_credito[config.cardBrand][config.installments] = config.percentage;
        } else if (config.paymentMethod !== 'tarjeta_credito') {
          organized[config.paymentMethod] = config.percentage;
        }
      });

      return organized;
    } catch (error) {
      console.error('Error organizando configuraciones:', error);
      throw new Error('Error al organizar configuraciones');
    }
  }
}
