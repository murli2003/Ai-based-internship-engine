import React from 'react';
import { Outlet } from 'react-router-dom';
import { ProviderDataProvider } from '../context/ProviderDataContext';

/**
 * ProviderDashboard is now a thin layout wrapper.
 * All tab content lives in /pages/provider/ sub-pages.
 * Shared data is provided via ProviderDataContext.
 */
export default function ProviderDashboard() {
  return (
    <ProviderDataProvider>
      <Outlet />
    </ProviderDataProvider>
  );
}
