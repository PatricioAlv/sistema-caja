'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BusinessConfig } from '@/types';
import { BusinessService } from '@/services/businessService';
import { useAuth } from './AuthContext';

interface BusinessContextType {
  businessConfig: BusinessConfig | null;
  loading: boolean;
  error: string | null;
  refreshBusinessConfig: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBusinessConfig = useCallback(async () => {
    if (!user) {
      setBusinessConfig(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = await user.getIdToken();
      if (!token) return;

      const config = await BusinessService.getBusinessConfig(token);
      setBusinessConfig(config);
    } catch (err) {
      console.error('Error al cargar configuración del negocio:', err);
      setError('Error al cargar la configuración del negocio');
      setBusinessConfig(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshBusinessConfig();
  }, [refreshBusinessConfig]);

  const value = {
    businessConfig,
    loading,
    error,
    refreshBusinessConfig,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
