import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import { useAuth } from './context/AuthContext';
import { useInactivityLogout } from './hooks/useInactivityLogout';
import { useSSE } from './hooks/useSSE';

// Lazy-loaded pages
const Login = lazy(() => import('./pages/Auth/Login'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const VerifyEmail = lazy(() => import('./pages/Auth/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserList = lazy(() => import('./pages/UserManagement/UserList'));
const RoleManagement = lazy(() => import('./pages/UserManagement/RoleManagement'));
const ProductList = lazy(() => import('./pages/Inventory/ProductList'));
const IMEITracker = lazy(() => import('./pages/Inventory/IMEITracker'));
const Categories = lazy(() => import('./pages/Inventory/Categories'));
const StockOverview = lazy(() => import('./pages/Stock/StockOverview'));
const StockTransfer = lazy(() => import('./pages/Stock/StockTransfer'));
const SalesList = lazy(() => import('./pages/Sales/SalesList'));
const SalesForm = lazy(() => import('./pages/Sales/SalesForm'));
const InvoiceDetail = lazy(() => import('./pages/Sales/InvoiceDetail'));
const Returns = lazy(() => import('./pages/Sales/Returns'));
const CustomerList = lazy(() => import('./pages/CRM/CustomerList'));
const CustomerDetail = lazy(() => import('./pages/CRM/CustomerDetail'));
const DueCollection = lazy(() => import('./pages/CRM/DueCollection'));
const WarrantyClaims = lazy(() => import('./pages/CRM/WarrantyClaims'));
const WarrantyReport = lazy(() => import('./pages/CRM/WarrantyReport'));
const SalesReport = lazy(() => import('./pages/Reports/SalesReport'));
const SupplierList = lazy(() => import('./pages/Suppliers/SupplierList'));
const PurchaseOrders = lazy(() => import('./pages/Purchases/PurchaseOrders'));
const ChartOfAccounts = lazy(() => import('./pages/Accounting/ChartOfAccounts'));
const JournalEntries = lazy(() => import('./pages/Accounting/JournalEntries'));
const BalanceSheetPage = lazy(() => import('./pages/Accounting/BalanceSheet'));
const ProfitLossPage = lazy(() => import('./pages/Accounting/ProfitLoss'));
const TrialBalancePage = lazy(() => import('./pages/Accounting/TrialBalance'));
const InvestorsPage = lazy(() => import('./pages/Accounting/Investors'));
const ExpensesPage = lazy(() => import('./pages/Accounting/Expenses'));
const AssetsPage = lazy(() => import('./pages/Accounting/AssetsPage'));
const LoansPage = lazy(() => import('./pages/Accounting/Loans'));
const EmployeeList = lazy(() => import('./pages/HR/EmployeeList'));
const Attendance = lazy(() => import('./pages/HR/Attendance'));
const LeaveManagement = lazy(() => import('./pages/HR/LeaveManagement'));
const Payroll = lazy(() => import('./pages/HR/Payroll'));
const RepairsView = lazy(() => import('./pages/RepairsView'));
const BranchManagement = lazy(() => import('./pages/Branches/BranchManagement'));
const WholesaleOrders = lazy(() => import('./pages/Wholesale/WholesaleOrders'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));
const ActivityLogs = lazy(() => import('./pages/Settings/ActivityLogs'));
const MyProfile = lazy(() => import('./pages/Settings/MyProfile'));
const SystemAnalytics = lazy(() => import('./pages/Settings/SystemAnalytics'));
const PublicInvoice = lazy(() => import('./pages/Sales/PublicInvoice'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));

const PageSkeletonLoader = () => (
  <div className="p-6 space-y-6 animate-pulse">
    {/* Top Header Skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="h-4 w-72 bg-gray-100 dark:bg-gray-800/60 rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
    </div>

    {/* Metric Cards Skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-3"
        >
          <div className="flex justify-between items-center">
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          </div>
          <div className="h-7 w-28 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>
      ))}
    </div>

    {/* Table / Content Skeleton */}
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="h-9 w-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="h-9 w-36 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/40 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800/60 rounded" />
              </div>
            </div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function App() {
  const { isAuthenticated } = useAuth();

  useSSE();
  useInactivityLogout();

  return (
    <Suspense fallback={<PageSkeletonLoader />}>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/invoice/:token" element={<PublicInvoice />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Sales — accessible with sales:view permission */}
          <Route
            path="sales"
            element={
              <RoleBasedRoute permissions={['sales:view']}>
                <SalesList />
              </RoleBasedRoute>
            }
          />
          <Route
            path="sales/new"
            element={
              <RoleBasedRoute permissions={['sales:create']}>
                <SalesForm />
              </RoleBasedRoute>
            }
          />
          <Route
            path="sales/:id"
            element={
              <RoleBasedRoute permissions={['sales:view']}>
                <InvoiceDetail />
              </RoleBasedRoute>
            }
          />
          <Route
            path="sales/returns"
            element={
              <RoleBasedRoute permissions={['sales:view', 'sales:create']}>
                <Returns />
              </RoleBasedRoute>
            }
          />

          {/* Inventory */}
          <Route
            path="products"
            element={
              <RoleBasedRoute permissions={['products:view']}>
                <ProductList />
              </RoleBasedRoute>
            }
          />
          <Route
            path="products/categories"
            element={
              <RoleBasedRoute permissions={['categories:manage']}>
                <Categories />
              </RoleBasedRoute>
            }
          />
          <Route
            path="inventory"
            element={
              <RoleBasedRoute permissions={['inventory:view']}>
                <IMEITracker />
              </RoleBasedRoute>
            }
          />
          <Route
            path="stock"
            element={
              <RoleBasedRoute permissions={['stock:view']}>
                <StockOverview />
              </RoleBasedRoute>
            }
          />
          <Route
            path="stock-transfer"
            element={
              <RoleBasedRoute permissions={['stock:transfer']}>
                <StockTransfer />
              </RoleBasedRoute>
            }
          />

          {/* CRM */}
          <Route
            path="customers"
            element={
              <RoleBasedRoute permissions={['customers:view']}>
                <CustomerList />
              </RoleBasedRoute>
            }
          />
          <Route
            path="customers/:id"
            element={
              <RoleBasedRoute permissions={['customers:view']}>
                <CustomerDetail />
              </RoleBasedRoute>
            }
          />
          <Route
            path="customers/due-collection"
            element={
              <RoleBasedRoute permissions={['customers:view', 'sales:view']}>
                <DueCollection />
              </RoleBasedRoute>
            }
          />
          <Route
            path="warranties"
            element={
              <RoleBasedRoute permissions={['warranties:view']}>
                <WarrantyClaims />
              </RoleBasedRoute>
            }
          />
          <Route
            path="warranties/report"
            element={
              <RoleBasedRoute permissions={['warranties:view']}>
                <WarrantyReport />
              </RoleBasedRoute>
            }
          />

          {/* Reports */}
          <Route
            path="reports"
            element={
              <RoleBasedRoute permissions={['reports:view']}>
                <SalesReport />
              </RoleBasedRoute>
            }
          />

          {/* Admin — users/roles management */}
          <Route
            path="users"
            element={
              <RoleBasedRoute permissions={['users:view', 'users:manage']}>
                <UserList />
              </RoleBasedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <RoleBasedRoute permissions={['roles:view', 'roles:manage']}>
                <RoleManagement />
              </RoleBasedRoute>
            }
          />

          {/* Purchases & Suppliers */}
          <Route
            path="purchases"
            element={
              <RoleBasedRoute permissions={['purchases:view', 'purchases:manage']}>
                <PurchaseOrders />
              </RoleBasedRoute>
            }
          />
          <Route
            path="suppliers"
            element={
              <RoleBasedRoute permissions={['suppliers:view', 'suppliers:manage']}>
                <SupplierList />
              </RoleBasedRoute>
            }
          />

          {/* Repairs */}
          <Route
            path="repairs"
            element={
              <RoleBasedRoute permissions={['repairs:view', 'repairs:manage']}>
                <RepairsView />
              </RoleBasedRoute>
            }
          />

          {/* Branches */}
          <Route
            path="branches"
            element={
              <RoleBasedRoute permissions={['branches:view', 'branches:manage']}>
                <BranchManagement />
              </RoleBasedRoute>
            }
          />

          {/* Wholesale */}
          <Route
            path="wholesale"
            element={
              <RoleBasedRoute permissions={['wholesale:view', 'wholesale:manage']}>
                <WholesaleOrders />
              </RoleBasedRoute>
            }
          />
          <Route
            path="wholesale/orders"
            element={
              <RoleBasedRoute permissions={['wholesale:view', 'wholesale:manage']}>
                <WholesaleOrders />
              </RoleBasedRoute>
            }
          />

          {/* Accounting */}
          <Route
            path="accounting"
            element={
              <RoleBasedRoute permissions={['accounting:view', 'accounting:manage']}>
                <ChartOfAccounts />
              </RoleBasedRoute>
            }
          />
          <Route
            path="accounting/investors"
            element={
              <RoleBasedRoute permissions={['accounting:view', 'accounting:manage']}>
                <InvestorsPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="accounting/expenses"
            element={
              <RoleBasedRoute permissions={['accounting:view', 'accounting:manage']}>
                <ExpensesPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="accounting/assets"
            element={
              <RoleBasedRoute permissions={['accounting:view', 'accounting:manage']}>
                <AssetsPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="accounting/loans"
            element={
              <RoleBasedRoute permissions={['accounting:view', 'accounting:manage']}>
                <LoansPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="accounting/journal-entries"
            element={
              <RoleBasedRoute permissions={['accounting:view', 'accounting:manage']}>
                <JournalEntries />
              </RoleBasedRoute>
            }
          />
          <Route
            path="accounting/balance-sheet"
            element={
              <RoleBasedRoute permissions={['accounting:view']}>
                <BalanceSheetPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="accounting/profit-loss"
            element={
              <RoleBasedRoute permissions={['accounting:view']}>
                <ProfitLossPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="accounting/trial-balance"
            element={
              <RoleBasedRoute permissions={['accounting:view']}>
                <TrialBalancePage />
              </RoleBasedRoute>
            }
          />

          {/* HR & Payroll */}
          <Route
            path="hr/employees"
            element={
              <RoleBasedRoute permissions={['employees:view', 'employees:manage']}>
                <EmployeeList />
              </RoleBasedRoute>
            }
          />
          <Route
            path="hr/attendance"
            element={
              <RoleBasedRoute permissions={['attendance:view', 'attendance:manage']}>
                <Attendance />
              </RoleBasedRoute>
            }
          />
          <Route
            path="hr/leaves"
            element={
              <RoleBasedRoute permissions={['leaves:view', 'leaves:manage']}>
                <LeaveManagement />
              </RoleBasedRoute>
            }
          />
          <Route
            path="hr/payroll"
            element={
              <RoleBasedRoute permissions={['payroll:view', 'payroll:manage']}>
                <Payroll />
              </RoleBasedRoute>
            }
          />
          <Route path="hr" element={<Navigate to="/hr/employees" replace />} />

          {/* Settings & Logs */}
          <Route path="profile" element={<MyProfile />} />
          <Route
            path="settings"
            element={
              <RoleBasedRoute permissions={['settings:view', 'settings:manage']}>
                <SettingsPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="activity-logs"
            element={
              <RoleBasedRoute permissions={['users:view']}>
                <ActivityLogs />
              </RoleBasedRoute>
            }
          />
          <Route
            path="system-analytics"
            element={
              <RoleBasedRoute permissions={['settings:view']}>
                <SystemAnalytics />
              </RoleBasedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
