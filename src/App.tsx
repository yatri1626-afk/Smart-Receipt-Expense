import React, { useState, useEffect } from 'react';
import { User, Receipt } from './types';
import { getCurrentUser, logoutUser, setCurrentUser, getStoredReceipts, saveStoredReceipts, api } from './services/api';

// Layout Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { ReceiptModal } from './components/ReceiptModal';

// Pages
import { AuthPage } from './pages/AuthPage';
import { PublicLandingPage } from './pages/PublicLandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadReceiptPage } from './pages/UploadReceiptPage';
import { ReceiptsHistoryPage } from './pages/ReceiptsHistoryPage';
import { ExpenseAnalysisPage } from './pages/ExpenseAnalysisPage';
import { HealthAnalysisPage } from './pages/HealthAnalysisPage';
import { ClothingAnalysisPage } from './pages/ClothingAnalysisPage';
import { GroceryAnalysisPage } from './pages/GroceryAnalysisPage';
import { BeautyCareAnalysisPage } from './pages/BeautyCareAnalysisPage';
import { HomeHouseholdAnalysisPage } from './pages/HomeHouseholdAnalysisPage';
import { BooksEducationAnalysisPage } from './pages/BooksEducationAnalysisPage';
import { ElectronicsAnalysisPage } from './pages/ElectronicsAnalysisPage';
import { ShoppingPage } from './pages/ShoppingPage';
import { NearbyShopsPage } from './pages/NearbyShopsPage';
import { SmartSuggestionsPage } from './pages/SmartSuggestionsPage';
import { BudgetPage } from './pages/BudgetPage';
import { MonthlyReportPage } from './pages/MonthlyReportPage';
import { SmartSearchPage } from './pages/SmartSearchPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/admin/AdminPage';

type DeviceMode = 'account' | 'receipts' | 'analysis' | 'admin' | null;

function getDeviceMode(): DeviceMode {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const raw = (params.get('device') || '').trim().toLowerCase();
  if (raw === 'account' || raw === 'receipts' || raw === 'analysis' || raw === 'admin') {
    return raw as DeviceMode;
  }
  if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
    return 'admin';
  }
  return null;
}

export default function App() {
  const deviceMode = getDeviceMode();
  const [currentUser, setUser] = useState<User | null>(() => {
    // Dedicated account laptop always starts from the registration screen.
    if (deviceMode === 'account') return null;
    return getCurrentUser();
  });
  const [sharedSessionLoading, setSharedSessionLoading] = useState<boolean>(
    deviceMode === 'receipts' || deviceMode === 'analysis'
  );
  const [sharedSessionError, setSharedSessionError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>(
    deviceMode === 'receipts' ? 'receipts' : deviceMode === 'analysis' ? 'expenses' : 'dashboard'
  );
  const [isAdminView, setIsAdminView] = useState<boolean>(() => deviceMode === 'admin');
  const [receipts, setReceipts] = useState<Receipt[]>(() => getStoredReceipts());
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [preloadedBillItem, setPreloadedBillItem] = useState<{ name: string; category: any; unitPrice: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [authView, setAuthView] = useState<'auth' | 'landing'>('auth');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Dedicated receipt/analysis laptops use the MySQL-backed shared account.
  // No user login is required on those two devices.
  useEffect(() => {
    if (deviceMode === 'account') {
      logoutUser();
      setUser(null);
      setReceipts([]);
      return;
    }

    if (deviceMode !== 'receipts' && deviceMode !== 'analysis') return;

    let cancelled = false;
    const loadSharedSession = async () => {
      setSharedSessionLoading(true);
      setSharedSessionError(null);
      try {
        const result = await api.getSharedSession();
        if (!cancelled) {
          setCurrentUser(result.user);
          setReceipts(getStoredReceipts(result.user.id || result.user.email));
        }
      } catch (err: any) {
        if (!cancelled) {
          setSharedSessionError(err?.message || 'Create an account on the Account laptop first.');
        }
      } finally {
        if (!cancelled) setSharedSessionLoading(false);
      }
    };

    loadSharedSession();
    return () => { cancelled = true; };
  }, [deviceMode]);

  // URL listener for /admin and #admin
  useEffect(() => {
    const checkUrl = () => {
      if (typeof window !== 'undefined') {
        const isAdmin = window.location.pathname.startsWith('/admin') || window.location.hash === '#admin';
        setIsAdminView(isAdmin);
      }
    };
    checkUrl();
    window.addEventListener('popstate', checkUrl);
    window.addEventListener('hashchange', checkUrl);
    return () => {
      window.removeEventListener('popstate', checkUrl);
      window.removeEventListener('hashchange', checkUrl);
    };
  }, []);

  // Keep receipts in sync whenever active user changes
  useEffect(() => {
    if (currentUser) {
      const userReceipts = getStoredReceipts(currentUser.id || currentUser.email);
      setReceipts(userReceipts);

      // Async pull from server database for cross-laptop multi-device persistence
      api.getReceipts().then(remoteReceipts => {
        if (Array.isArray(remoteReceipts)) {
          setReceipts(remoteReceipts);
        }
      }).catch(() => {});
    } else {
      setReceipts([]);
    }
  }, [currentUser?.id, currentUser?.email]);

  // Keep the receipt and analysis laptops live: an upload on laptop 2
  // becomes visible on laptop 3 automatically.
  useEffect(() => {
    if ((deviceMode !== 'receipts' && deviceMode !== 'analysis') || !currentUser) return;

    const refresh = async () => {
      try {
        const remote = await api.getReceipts();
        if (Array.isArray(remote)) setReceipts(remote);
      } catch (e) {}
    };

    const intervalId = window.setInterval(refresh, 2000);
    return () => window.clearInterval(intervalId);
  }, [deviceMode, currentUser?.id, currentUser?.email]);

  // Auth Handlers
  const handleLoginSuccess = async (user: User) => {
    setUser(user);
    const userReceipts = getStoredReceipts(user.id || user.email);
    setReceipts(userReceipts);
    try {
      const remote = await api.getReceipts();
      if (Array.isArray(remote)) {
        setReceipts(remote);
      }
    } catch (e) {}
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setReceipts([]);
    setAuthView('auth');
    setIsRegisterMode(false);
  };

  // Receipt creation / deletion
  const handleReceiptAdded = (newReceipt: Receipt) => {
    const updated = [newReceipt, ...receipts.filter(r => r.id !== newReceipt.id)];
    setReceipts(updated);
    saveStoredReceipts(updated, currentUser?.id || currentUser?.email);
    api.saveReceipt(newReceipt).catch(() => {});
  };

  const handleReceiptDeleted = (id: string) => {
    setReceipts((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveStoredReceipts(updated, currentUser?.id || currentUser?.email);
      return updated;
    });
    api.deleteReceipt(id).catch(() => {});
  };

  const handleSearchTrigger = (query: string) => {
    setSearchQuery(query);
    setCurrentTab('search');
  };

  // Admin Page view (can be opened via /admin or Admin button)
  if (isAdminView) {
    return (
      <AdminPage
        onBackToApp={() => {
          setIsAdminView(false);
          if (typeof window !== 'undefined') {
            if (window.location.pathname.startsWith('/admin')) {
              window.history.pushState(null, '', '/');
            } else if (window.location.hash === '#admin') {
              window.location.hash = '';
            }
          }
        }}
      />
    );
  }

  // Receipt/analysis kiosk devices never show the normal login page.
  if ((deviceMode === 'receipts' || deviceMode === 'analysis') && sharedSessionLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Connecting to shared workspace…</p>
          <p className="text-xs text-zinc-500 mt-1">Reading the central MySQL account</p>
        </div>
      </div>
    );
  }

  if ((deviceMode === 'receipts' || deviceMode === 'analysis') && !currentUser) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 text-center shadow-xl">
          <h1 className="text-xl font-black text-zinc-900 dark:text-white">Shared account not ready</h1>
          <p className="text-sm text-zinc-500 mt-2">
            {sharedSessionError || 'Create the account on Laptop 1 first.'}
          </p>
          <p className="text-xs text-zinc-400 mt-4">This device does not require a login.</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show Auth or Landing page as requested by prompt
  if (!currentUser) {
    if (authView === 'landing') {
      return (
        <PublicLandingPage
          onOpenAuth={(isRegister) => {
            setIsRegisterMode(!!isRegister);
            setAuthView('auth');
          }}
          onQuickDemo={() => {
            const demoUser: User = {
              id: 'user-demo-1',
              name: 'Rahul Sharma',
              email: 'rahul@expenseinsight.com',
              monthlyBudget: 10000,
              preferredCategories: ['Grocery', 'Clothing', 'Food & Health', 'Electronics'],
              createdAt: '2026-08-01T00:00:00Z'
            };
            setCurrentUser(demoUser, 'jwt_demo_default');
            setUser(demoUser);
            setReceipts(getStoredReceipts('user-demo-1'));
            setCurrentTab('dashboard');
          }}
        />
      );
    }

    return (
      <AuthPage
        onSuccess={handleLoginSuccess}
        onLoginSuccess={handleLoginSuccess}
        initialIsRegister={isRegisterMode}
        onBackToHome={() => setAuthView('landing')}
        onExplorePublicLanding={() => setAuthView('landing')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans transition-colors">
      
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        receipts={receipts}
        currentTab={currentTab}
        activePage={currentTab}
        onLogout={handleLogout}
        onNavigate={(tab) => setCurrentTab(tab)}
        onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onSearch={handleSearchTrigger}
        onSearchQuery={handleSearchTrigger}
        onQuickUpload={() => setCurrentTab('upload')}
      />

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex gap-6 pb-20 md:pb-6">
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <Sidebar
            currentTab={currentTab}
            activePage={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
            onNavigate={(tab) => setCurrentTab(tab)}
            onLogout={handleLogout}
            receiptsCount={receipts.length}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        <div className="md:hidden">
          <Sidebar
            currentTab={currentTab}
            activePage={currentTab}
            onSelectTab={(tab) => {
              setCurrentTab(tab);
              setIsMobileSidebarOpen(false);
            }}
            onNavigate={(tab) => {
              setCurrentTab(tab);
              setIsMobileSidebarOpen(false);
            }}
            onLogout={handleLogout}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            receiptsCount={receipts.length}
          />
        </div>

        {/* Dynamic Page Views */}
        <main className="flex-1 min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardPage
              user={currentUser}
              receipts={receipts}
              onNavigate={(tab) => setCurrentTab(tab)}
              onViewReceipt={(receipt) => setSelectedReceipt(receipt)}
              onDeleteReceipt={handleReceiptDeleted}
            />
          )}

          {(currentTab === 'upload' || currentTab === 'upload-manual') && (
            <UploadReceiptPage
              receipts={receipts}
              initialMode={currentTab === 'upload-manual' ? 'manual' : 'scan'}
              preloadedItem={preloadedBillItem}
              onReceiptSaved={(newReceipt) => {
                handleReceiptAdded(newReceipt);
                setPreloadedBillItem(null);
              }}
              onDeleteReceipt={handleReceiptDeleted}
              onReceiptsChange={(updated) => {
                setReceipts(updated);
                saveStoredReceipts(updated, currentUser?.id || currentUser?.email);
              }}
              onViewReceipt={(receipt) => setSelectedReceipt(receipt)}
              onNavigate={(tab) => setCurrentTab(tab)}
              onCancel={() => {
                setPreloadedBillItem(null);
                setCurrentTab('dashboard');
              }}
            />
          )}

          {currentTab === 'receipts' && (
            <ReceiptsHistoryPage
              receipts={receipts}
              onViewReceipt={(receipt) => setSelectedReceipt(receipt)}
              onDeleteReceipt={handleReceiptDeleted}
              onReceiptsChange={(updated) => {
                setReceipts(updated);
                saveStoredReceipts(updated, currentUser?.id || currentUser?.email);
              }}
              onNavigate={(tab) => setCurrentTab(tab)}
              onUploadClick={() => setCurrentTab('upload')}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpenseAnalysisPage
              receipts={receipts}
            />
          )}

          {currentTab === 'health' && (
            <HealthAnalysisPage receipts={receipts} />
          )}

          {currentTab === 'clothing' && (
            <ClothingAnalysisPage receipts={receipts} />
          )}

          {currentTab === 'grocery' && (
            <GroceryAnalysisPage receipts={receipts} />
          )}

          {currentTab === 'beauty' && (
            <BeautyCareAnalysisPage 
              receipts={receipts}
              onNavigate={(tab) => setCurrentTab(tab)}
              onAddItemToBill={(item) => {
                setPreloadedBillItem(item);
                setCurrentTab('upload-manual');
              }}
            />
          )}

          {currentTab === 'home-household' && (
            <HomeHouseholdAnalysisPage 
              receipts={receipts}
              onNavigate={(tab) => setCurrentTab(tab)}
              onAddItemToBill={(item) => {
                setPreloadedBillItem(item);
                setCurrentTab('upload-manual');
              }}
            />
          )}

          {currentTab === 'books-education' && (
            <BooksEducationAnalysisPage 
              receipts={receipts}
              onNavigate={(tab) => setCurrentTab(tab)}
              onAddItemToBill={(item) => {
                setPreloadedBillItem(item);
                setCurrentTab('upload-manual');
              }}
            />
          )}

          {currentTab === 'electronics' && (
            <ElectronicsAnalysisPage 
              receipts={receipts}
              onNavigate={(tab) => setCurrentTab(tab)}
              onAddItemToBill={(item) => {
                setPreloadedBillItem(item);
                setCurrentTab('upload-manual');
              }}
            />
          )}

          {currentTab === 'shopping' && (
            <ShoppingPage
              user={currentUser}
              receipts={receipts}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'nearby' && (
            <NearbyShopsPage
              onNavigateToShopping={() => setCurrentTab('shopping')}
            />
          )}

          {currentTab === 'suggestions' && (
            <SmartSuggestionsPage
              user={currentUser}
              receipts={receipts}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'budget' && (
            <BudgetPage
              user={currentUser}
              receipts={receipts}
              onNavigate={(tab) => setCurrentTab(tab)}
              onUserBudgetUpdate={(newBudget) => {
                const updated = { ...currentUser, monthlyBudget: newBudget };
                setUser(updated);
                setCurrentUser(updated);
              }}
            />
          )}

          {currentTab === 'report' && (
            <MonthlyReportPage
              user={currentUser}
              receipts={receipts}
            />
          )}

          {currentTab === 'search' && (
            <SmartSearchPage
              receipts={receipts}
              initialQuery={searchQuery}
            />
          )}

          {currentTab === 'profile' && (
            <ProfilePage
              user={currentUser}
              receipts={receipts}
              onUserUpdate={(u) => setUser(u)}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer onNavigate={(tab) => setCurrentTab(tab)} />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        activePage={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onUpdateReceipt={(updated) => {
            const updatedList = receipts.map((r) => (r.id === updated.id ? updated : r));
            setReceipts(updatedList);
            saveStoredReceipts(updatedList, currentUser?.id || currentUser?.email);
            setSelectedReceipt(updated);
          }}
          onDelete={(id) => {
            handleReceiptDeleted(id);
            setSelectedReceipt(null);
          }}
        />
      )}

    </div>
  );
}
