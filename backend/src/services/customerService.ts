import { firestore } from '../config/firebase';
import { Customer, CreateCustomerData, CustomerFilters } from '../../../shared/types';

export class CustomerService {
  private customersCollection = firestore.collection('customers');

  async createCustomer(data: CreateCustomerData & { userId: string }): Promise<Customer> {
    console.log('🔧 CustomerService.createCustomer - Datos recibidos:', data);
    
    const now = new Date();
    
    const customerData: Omit<Customer, 'id'> = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      creditLimit: data.creditLimit,
      notes: data.notes,
      userId: data.userId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    console.log('💾 Datos a guardar en Firestore:', customerData);

    try {
      const docRef = await this.customersCollection.add(customerData);
      
      const result = {
        id: docRef.id,
        ...customerData
      };
      
      console.log('✅ Cliente guardado exitosamente:', result);
      
      return result;
    } catch (error) {
      console.error('💥 Error al guardar en Firestore:', error);
      throw error;
    }
  }

  async getCustomers(filters: CustomerFilters): Promise<Customer[]> {
    let query = this.customersCollection.where('userId', '==', filters.userId);
    
    if (filters.name) {
      // Firestore no soporta búsqueda de texto, así que filtramos en memoria
      const snapshot = await query.get();
      let customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Customer));
      
      // Filtrar por nombre en memoria
      const searchTerm = filters.name.toLowerCase();
      customers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm)
      );
      
      return customers;
    }
    
    const snapshot = await query.orderBy('name', 'asc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Customer));
  }

  async getCustomerById(id: string, userId: string): Promise<Customer | null> {
    const doc = await this.customersCollection.doc(id).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Customer, 'id'>;
    
    // Verificar que el cliente pertenezca al usuario
    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data
    };
  }

  async updateCustomer(id: string, updates: Partial<CreateCustomerData>, userId: string): Promise<Customer | null> {
    const existingCustomer = await this.getCustomerById(id, userId);
    
    if (!existingCustomer) {
      return null;
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.creditLimit !== undefined) updateData.creditLimit = updates.creditLimit;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    await this.customersCollection.doc(id).update(updateData);

    return {
      ...existingCustomer,
      ...updateData
    };
  }

  async deleteCustomer(id: string, userId: string): Promise<boolean> {
    const existingCustomer = await this.getCustomerById(id, userId);
    
    if (!existingCustomer) {
      return false;
    }

    // TODO: Verificar que no tenga movimientos pendientes
    // Por ahora solo eliminamos el cliente
    await this.customersCollection.doc(id).delete();
    return true;
  }

  async searchCustomers(searchTerm: string, userId: string): Promise<Customer[]> {
    // Implementar búsqueda básica
    const snapshot = await this.customersCollection
      .where('userId', '==', userId)
      .get();
    
    const customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Customer));
    
    const term = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(term) ||
      (customer.email && customer.email.toLowerCase().includes(term)) ||
      (customer.phone && customer.phone.includes(term))
    );
  }
}
