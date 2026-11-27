import React, { useState, useEffect } from 'react';
import { AdminLayout, AdminTab } from '../../components/admin/AdminLayout';
import { AdminLoginPage } from './AdminLoginPage';
import { AdminDashboardPage } from './AdminDashboardPage';
import { AdminUsersPage } from './AdminUsersPage';
import { AdminReceiptsPage } from './AdminReceiptsPage';
import { AdminReportsPage } from './AdminReportsPage';
import { isAdminLoggedIn, adminLogout } from '../../services/adminApi';

interface AdminPageProps {
  onBackToApp: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToApp }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => isAdminLoggedIn());
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [receiptUserFilter, setReceiptUserFilter] = useState<string>('');

  useEffect(() => {
    setIsLoggedIn(isAdminLoggedIn());
  }, []);

  if (!isLoggedIn) {
    return (
      <AdminLoginPage
        onLoginSuccess={() => setIsLoggedIn(true)}
        onBackToApp={onBackToApp}
      />
    );
  }

  const handleNavigateToReceiptsForUser = (userEmailOrId?: string) => {
    if (userEmailOrId) {
      setReceiptUserFilter(userEmailOrId);
    }
    setCurrentTab('receipts');
  };

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={(tab) => {
        if (tab !== 'receipts') {
          setReceiptUserFilter('');
        }
        setCurrentTab(tab);
      }}
      onLogout={() => {
        adminLogout();
        setIsLoggedIn(false);
      }}
      onBackToApp={onBackToApp}
    >
      {currentTab === 'dashboard' && (
        <AdminDashboardPage
          onNavigateToUsers={() => setCurrentTab('users')}
          onNavigateToReceipts={() => setCurrentTab('receipts')}
        />
      )}
      {currentTab === 'users' && (
        <AdminUsersPage
          onNavigateToReceipts={handleNavigateToReceiptsForUser}
        />
      )}
      {currentTab === 'receipts' && (
        <AdminReceiptsPage
          initialUserFilter={receiptUserFilter}
          onClearUserFilter={() => setReceiptUserFilter('')}
        />
      )}
      {currentTab === 'reports' && <AdminReportsPage />}
    </AdminLayout>
  );
};
