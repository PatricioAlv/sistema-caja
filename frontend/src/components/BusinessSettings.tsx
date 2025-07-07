'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { BusinessConfig } from '@/types';
import { BusinessService } from '@/services/businessService';

export default function BusinessSettings() {
  const { user } = useAuth();
  const { refreshBusinessConfig } = useBusiness();
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Formulario
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires'
  });

  // Cargar configuración existente
  useEffect(() => {
    const loadBusinessConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = await user?.getIdToken();
        if (!token) return;

        const businessConfig = await BusinessService.getBusinessConfig(token);
        
        if (businessConfig) {
          setConfig(businessConfig);
          setFormData({
            businessName: businessConfig.businessName || '',
            ownerName: businessConfig.ownerName || '',
            address: businessConfig.address || '',
            phone: businessConfig.phone || '',
            email: businessConfig.email || '',
            website: businessConfig.website || '',
            description: businessConfig.description || '',
            currency: businessConfig.currency || 'ARS',
            timezone: businessConfig.timezone || 'America/Argentina/Buenos_Aires'
          });
        }
      } catch (err) {
        console.error('Error al cargar la configuración:', err);
        setError('Error al cargar la configuración del negocio');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadBusinessConfig();
    }
  }, [user]);

  const resetForm = () => {
    if (config) {
      setFormData({
        businessName: config.businessName || '',
        ownerName: config.ownerName || '',
        address: config.address || '',
        phone: config.phone || '',
        email: config.email || '',
        website: config.website || '',
        description: config.description || '',
        currency: config.currency || 'ARS',
        timezone: config.timezone || 'America/Argentina/Buenos_Aires'
      });
    } else {
      setFormData({
        businessName: '',
        ownerName: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        description: '',
        currency: 'ARS',
        timezone: 'America/Argentina/Buenos_Aires'
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const token = await user.getIdToken();
      if (!token) return;

      const savedConfig = await BusinessService.saveBusinessConfig(formData, token);
      setConfig(savedConfig);
      setSuccessMessage('Configuración guardada exitosamente');
      
      // Refrescar el contexto del negocio
      await refreshBusinessConfig();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error al guardar la configuración:', err);
      setError('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">🏪 Configuración del Negocio</h2>
        <p className="text-gray-600">Configura los datos de tu negocio que aparecerán en el sistema</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Negocio *
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Ej: Mi Negocio"
              />
            </div>

            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Propietario
              </label>
              <input
                type="text"
                id="ownerName"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Ej: Juan Pérez"
              />
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Ej: +54 11 1234-5678"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Ej: contacto@minegocio.com"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="Ej: Av. Corrientes 1234, CABA"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Sitio Web
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="Ej: https://www.minegocio.com"
            />
          </div>
        </div>

        {/* Configuración Regional */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración Regional</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="ARS">Peso Argentino (ARS)</option>
                <option value="USD">Dólar Americano (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="BRL">Real Brasileño (BRL)</option>
                <option value="CLP">Peso Chileno (CLP)</option>
              </select>
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                Zona Horaria
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                <option value="America/Argentina/Mendoza">Mendoza (GMT-3)</option>
                <option value="America/Argentina/Salta">Salta (GMT-3)</option>
                <option value="America/New_York">New York (GMT-5)</option>
                <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
                <option value="Europe/Madrid">Madrid (GMT+1)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción del Negocio
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            placeholder="Describe brevemente tu negocio..."
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={resetForm}
            disabled={isSaving}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
