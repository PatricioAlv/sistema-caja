'use client';

import { useState, useEffect, useCallback } from 'react';
import { Customer, AccountMovement, ImportCustomerData } from '@/types';
import { CustomerImport } from './CustomerImport';
import { CreditSaleForm } from './CreditSaleForm';
import { PaymentForm } from './PaymentForm';
import { Plus, Search, Edit, Trash2, Eye, CreditCard, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { accountMovementService } from '@/lib/api';

export const CustomerManagement: React.FC = () => {
  const { getIdToken, user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para saldos de clientes
  const [customerBalances, setCustomerBalances] = useState<{[key: string]: number}>({});
  const [customerLastPayments, setCustomerLastPayments] = useState<{[key: string]: string | null}>({});

  // Estados para edición de cliente
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Formulario de cliente
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    creditLimit: 0,
    notes: ''
  });

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Estado de autenticación:', {
        userExists: !!user,
        userEmail: user?.email,
        userUid: user?.uid
      });
      
      const token = await getIdToken();
      
      console.log('🎫 Token obtenido:', {
        tokenExists: !!token,
        tokenLength: token?.length,
        tokenStart: token?.substring(0, 20) + '...'
      });
      
      if (!token) {
        setError('Usuario no autenticado. Por favor, inicia sesión.');
        setCustomers([]);
        return;
      }
      
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar clientes');
      const data = await response.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('💥 Error cargando clientes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setCustomers([]); // Asegurar que siempre sea un array
    } finally {
      setLoading(false);
    }
  }, [getIdToken, user]);

  // Función para cargar saldos de clientes
  const loadCustomerBalances = useCallback(async () => {
    try {
      const token = await getIdToken();
      
      const response = await fetch('/api/customers/balances', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar saldos');
      }
      
      const data = await response.json();
      
      // Convertir array a objeto para acceso fácil por ID
      const balances: {[key: string]: number} = {};
      const lastPayments: {[key: string]: string | null} = {};
      
      data.forEach((item: {customer: Customer, balance: number, lastPaymentDate: string | null}) => {
        balances[item.customer.id] = item.balance;
        lastPayments[item.customer.id] = item.lastPaymentDate;
      });
      
      setCustomerBalances(balances);
      setCustomerLastPayments(lastPayments);
    } catch (error) {
      console.error('Error loading customer balances:', error);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadCustomers();
    loadCustomerBalances();
  }, [loadCustomers, loadCustomerBalances]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getIdToken();
      
      if (!token) {
        setError('Debes estar autenticado para crear un cliente');
        return;
      }
      
      console.log('🎫 Token obtenido:', token ? `${token.substring(0, 50)}...` : 'null');
      
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      console.log('📤 Petición enviada:', {
        method: 'POST',
        url: '/api/customers',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token ? token.substring(0, 50) + '...' : 'null'}`
        },
        body: formData
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `Error ${response.status}: ${response.statusText}` };
        }
        
        console.error('❌ Error en respuesta:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      await loadCustomers();
      await loadCustomerBalances();
      setShowCreateForm(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        creditLimit: 0,
        notes: ''
      });
    } catch (err) {
      console.error('💥 Error al crear cliente:', err);
      setError(err instanceof Error ? err.message : 'Error al crear cliente');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;
    
    try {
      const token = await getIdToken();
      
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al eliminar cliente');
      
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cliente');
    }
  };

  // Función para abrir modal de edición
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      taxId: customer.taxId || '',
      creditLimit: customer.creditLimit || 0,
      notes: customer.notes || ''
    });
    setShowEditForm(true);
  };

  // Función para actualizar cliente
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      setLoading(true);
      setError(null);

      const token = await getIdToken();
      
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar cliente');
      }

      // Recargar clientes
      await loadCustomers();
      
      // Cerrar modal
      setShowEditForm(false);
      setEditingCustomer(null);
      
      // Limpiar formulario
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        creditLimit: 0,
        notes: ''
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = (customers || []).filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar clientes por fecha de último pago (más retrasados primero)
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const dateA = customerLastPayments[a.id];
    const dateB = customerLastPayments[b.id];
    
    // Clientes sin pagos van primero (más críticos)
    if (!dateA && !dateB) return 0;
    if (!dateA) return -1;
    if (!dateB) return 1;
    
    // Ordenar por fecha: más antigua primero (más retrasados)
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  // Función para calcular días desde el último pago y obtener color
  const getPaymentStatus = (customerId: string) => {
    const lastPayment = customerLastPayments[customerId];
    const balance = customerBalances[customerId] || 0;
    
    if (!lastPayment) {
      return balance > 0 ? { color: 'text-red-700 bg-red-50', text: 'Sin pagos', days: Infinity } : { color: 'text-gray-600', text: 'Sin pagos', days: 0 };
    }
    
    const daysSincePayment = Math.floor((new Date().getTime() - new Date(lastPayment).getTime()) / (1000 * 60 * 60 * 24));
    
    if (balance <= 0) {
      return { color: 'text-gray-600', text: new Date(lastPayment).toLocaleDateString('es-ES'), days: daysSincePayment };
    }
    
    if (daysSincePayment > 30) {
      return { color: 'text-red-700 bg-red-50', text: new Date(lastPayment).toLocaleDateString('es-ES'), days: daysSincePayment };
    } else if (daysSincePayment > 15) {
      return { color: 'text-orange-700 bg-orange-50', text: new Date(lastPayment).toLocaleDateString('es-ES'), days: daysSincePayment };
    } else {
      return { color: 'text-yellow-700 bg-yellow-50', text: new Date(lastPayment).toLocaleDateString('es-ES'), days: daysSincePayment };
    }
  };

  // const calculateBalance = (_customer: Customer) => {
  //   // Por ahora retornamos 0, después se calculará desde los movimientos
  //   return 0;
  // };

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold">Autenticación requerida</p>
              <p className="text-sm">Debes iniciar sesión para gestionar clientes.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Importar Excel
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Solo mostrar contenido si hay usuario autenticado */}
      {!user && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          ⚠️ No hay usuario autenticado. Debes iniciar sesión para gestionar clientes.
        </div>
      )}

      {/* Customers Table */}
      {user && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Saldo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  Última Entrega
                  <span className="text-red-500" title="Ordenado por prioridad: más retrasados primero">↑</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    {customer.taxId && (
                      <div className="text-sm text-gray-500">CUIT: {customer.taxId}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    {customer.email && (
                      <div className="text-sm text-gray-900">{customer.email}</div>
                    )}
                    {customer.phone && (
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${
                    (customerBalances[customer.id] || 0) > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    ${(customerBalances[customer.id] || 0).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(() => {
                    const status = getPaymentStatus(customer.id);
                    return (
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium px-2 py-1 rounded ${status.color}`}>
                          {status.text}
                        </span>
                        {status.days > 0 && status.days !== Infinity && (
                          <span className="text-xs text-gray-500 mt-1">
                            {status.days} días atrás
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Ver cuenta"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id!)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No se encontraron clientes</div>
          </div>
        )}
        </div>
      )}

      {/* Create Customer Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nuevo Cliente</h3>
            <form onSubmit={handleCreateCustomer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    CUIT/DNI
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Crear Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Importar Clientes desde Excel</h3>
              <button
                onClick={() => setShowImport(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <CustomerImport
              onImport={async (importData: ImportCustomerData) => {
                try {
                  console.log('📥 Datos a importar:', {
                    customerName: importData.customerName,
                    movementsCount: importData.movements.length,
                    movements: importData.movements
                  });
                  
                  const token = await getIdToken();
                  if (!token) {
                    throw new Error('No se pudo obtener el token de autenticación');
                  }
                  
                  const result = await accountMovementService.importMovements(importData, token);
                  
                  console.log('✅ Importación exitosa:', result);
                  
                  // Cerrar modal y recargar clientes
                  setShowImport(false);
                  await loadCustomers();
                  
                } catch (err) {
                  console.error('❌ Error al importar:', err);
                  setError(err instanceof Error ? err.message : 'Error al importar datos');
                }
              }}
              onClose={() => setShowImport(false)}
            />
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerAccountView
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          getIdToken={getIdToken}
          onDataChanged={loadCustomerBalances} // Callback para recargar saldos
        />
      )}

      {/* Edit Customer Modal */}
      {showEditForm && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Editar Cliente</h3>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditingCustomer(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  CUIT/DNI
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-500"
                />
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para visualizar la cuenta de un cliente
interface CustomerAccountViewProps {
  customer: Customer;
  onClose: () => void;
  getIdToken: () => Promise<string | null>;
  onDataChanged?: () => void; // Callback opcional para cuando cambian los datos
}

const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({ customer, onClose, getIdToken, onDataChanged }) => {
  const [movements, setMovements] = useState<AccountMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreditSaleForm, setShowCreditSaleForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    const loadMovements = async () => {
      try {
        setLoading(true);
        const token = await getIdToken();
        
        if (!token) {
          console.error('No hay token de autenticación');
          setMovements([]);
          return;
        }
        
        const response = await fetch(`/api/account-movements?customerId=${customer.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Error al cargar movimientos');
        const data = await response.json();
        
        console.log('Respuesta del API de movimientos:', data);
        
        // El endpoint del frontend debería devolver directamente un array
        if (Array.isArray(data)) {
          setMovements(data);
        } else if (data && data.data && Array.isArray(data.data)) {
          setMovements(data.data);
        } else {
          console.warn('Respuesta inesperada del API:', data);
          setMovements([]);
        }
      } catch (err) {
        console.error('Error al cargar movimientos:', err);
        setMovements([]); // Asegurar que siempre sea un array
      } finally {
        setLoading(false);
      }
    };

    loadMovements();
  }, [customer.id, getIdToken]);

  const reloadMovements = async () => {
    try {
      const token = await getIdToken();
      
      const response = await fetch(`/api/account-movements?customerId=${customer.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar movimientos');
      const data = await response.json();
      
      // Asegurar que data es un array
      if (data && data.data && Array.isArray(data.data)) {
        setMovements(data.data);
      } else if (Array.isArray(data)) {
        setMovements(data);
      } else {
        console.warn('Respuesta inesperada del API:', data);
        setMovements([]);
      }
    } catch (err) {
      console.error('Error al cargar movimientos:', err);
      setMovements([]); // Asegurar que siempre sea un array
    }
  };

  // Función para recargar tanto movimientos como saldos
  const reloadData = async () => {
    await reloadMovements();
    // Notificar al componente padre para recargar saldos
    if (onDataChanged) {
      onDataChanged();
    }
  };

  const calculateBalance = () => {
    // Validar que movements es un array antes de usar reduce
    if (!Array.isArray(movements)) {
      console.warn('movements no es un array:', movements);
      return 0;
    }
    
    return movements.reduce((balance, movement) => {
      // sale = venta a crédito = aumenta la deuda del cliente (+)
      // payment = pago del cliente = disminuye la deuda del cliente (-)
      return movement.type === 'sale' ? balance + movement.amount : balance - movement.amount;
    }, 0);
  };

  const formatMovementType = (type: AccountMovement['type']) => {
    switch (type) {
      case 'sale': return 'Venta a Crédito';
      case 'payment': return 'Pago';
      case 'adjustment': return 'Ajuste';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{customer.name}</h3>
            <p className="text-gray-700 font-medium">Estado de Cuenta</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-gray-800">Información del Cliente</h4>
            <div className="space-y-1 text-sm text-gray-700">
              {customer.email && <p className="font-medium">Email: <span className="font-semibold text-gray-800">{customer.email}</span></p>}
              {customer.phone && <p className="font-medium">Teléfono: <span className="font-semibold text-gray-800">{customer.phone}</span></p>}
              {customer.address && <p className="font-medium">Dirección: <span className="font-semibold text-gray-800">{customer.address}</span></p>}
              {customer.taxId && <p className="font-medium">CUIT: <span className="font-semibold text-gray-800">{customer.taxId}</span></p>}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-gray-800">Resumen de Cuenta</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p className="font-medium">Saldo Actual: <span className={`font-bold ${calculateBalance() >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ${calculateBalance().toFixed(2)}
              </span></p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowCreditSaleForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <CreditCard size={16} />
            Registrar Venta a Crédito
          </button>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <DollarSign size={16} />
            Registrar Pago
          </button>
        </div>

        {/* Movements Table */}
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b">
            <h4 className="font-semibold text-gray-800">Movimientos de Cuenta</h4>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(movements) && movements.map((movement) => (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-800">
                          {new Date(movement.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            movement.type === 'sale' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {formatMovementType(movement.type)}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700">
                          {movement.code ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                              {movement.code}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-800">
                          {movement.description}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className={`font-bold ${
                            movement.type === 'sale' ? 'text-blue-700' : 'text-green-700'
                          }`}>
                            {movement.type === 'sale' ? '+' : '-'}${movement.amount.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
              
              {(!Array.isArray(movements) || movements.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No hay movimientos registrados
                </div>
              )}
            </div>
          )}
        </div>

        {/* Credit Sale Form */}
        {showCreditSaleForm && (
          <CreditSaleForm
            customer={customer}
            onSaleCreated={() => {
              setShowCreditSaleForm(false);
              reloadData(); // Recargar movimientos y saldos
            }}
            onClose={() => setShowCreditSaleForm(false)}
          />
        )}

        {/* Payment Form */}
        {showPaymentForm && (
          <PaymentForm
            customer={customer}
            onPaymentCreated={() => {
              setShowPaymentForm(false);
              reloadData(); // Recargar movimientos y saldos
            }}
            onClose={() => setShowPaymentForm(false)}
          />
        )}
      </div>
    </div>
  );
};
