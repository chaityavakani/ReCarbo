import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SupplierDashboard } from './SupplierDashboard';
import { BuyerDashboard } from './BuyerDashboard';
import { AdminDashboard } from './AdminDashboard';

export const DashboardDispatcher: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  if (user?.role === 'SUPPLIER') {
    return <SupplierDashboard />;
  }

  return <BuyerDashboard />;
};
