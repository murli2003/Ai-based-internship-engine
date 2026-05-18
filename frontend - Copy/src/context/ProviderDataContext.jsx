import React, { createContext, useContext } from 'react';
import toast from 'react-hot-toast';
import { useProviderDashboard } from '../hooks/useProviderDashboard';

const ProviderDataContext = createContext(null);

export function ProviderDataProvider({ children }) {
  const data = useProviderDashboard();
  return (
    <ProviderDataContext.Provider value={data}>
      {children}
    </ProviderDataContext.Provider>
  );
}

export function useProviderData() {
  const ctx = useContext(ProviderDataContext);
  if (!ctx) throw new Error('useProviderData must be used within ProviderDataProvider');
  return ctx;
}
