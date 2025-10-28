import React from 'react';
import type { Page, Permission } from '../types';
import { DashboardIcon, ProductIcon, CustomerIcon, SalesIcon, PurchasesIcon, InstallmentsIcon, ReportsIcon, XIcon, AdminIcon, SafeIcon, MaintenanceIcon, StoreIcon, TransferIcon, ReceiptIcon, UsersIcon, UndoIcon } from './icons';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  hasPermission: (permission: Permission) => boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, setIsOpen, hasPermission }) => {
  
  const navItems: {id: Page, label: string, icon: React.ElementType, requiredPermission: Permission}[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: DashboardIcon, requiredPermission: 'view_dashboard' },
    { id: 'storeInfo', label: 'بيانات المتجر', icon: StoreIcon, requiredPermission: 'manage_store_info' },
    { id: 'products', label: 'المنتجات', icon: ProductIcon, requiredPermission: 'manage_products' },
    { id: 'customers', label: 'العملاء', icon: CustomerIcon, requiredPermission: 'manage_customers' },
    { id: 'suppliers', label: 'الموردين', icon: UsersIcon, requiredPermission: 'manage_suppliers' },
    { id: 'treasury', label: 'الخزنة', icon: SafeIcon, requiredPermission: 'manage_treasury' },
    { id: 'cashTransfers', label: 'تحويلات الكاش', icon: TransferIcon, requiredPermission: 'manage_cash_transfers' },
    { id: 'sales', label: 'المبيعات', icon: SalesIcon, requiredPermission: 'perform_sales' },
    { id: 'purchases', label: 'المشتريات', icon: PurchasesIcon, requiredPermission: 'manage_purchases' },
    { id: 'returns', label: 'المرتجعات', icon: UndoIcon, requiredPermission: 'manage_returns'},
    { id: 'installments', label: 'الأقساط', icon: InstallmentsIcon, requiredPermission: 'manage_installments' },
    { id: 'maintenance', label: 'الصيانة', icon: MaintenanceIcon, requiredPermission: 'manage_maintenance' },
    { id: 'expenses', label: 'المصروفات', icon: ReceiptIcon, requiredPermission: 'manage_expenses' },
    { id: 'reports', label: 'التقارير', icon: ReportsIcon, requiredPermission: 'view_reports' },
    { id: 'admin', label: 'لوحة تحكم المدير', icon: AdminIcon, requiredPermission: 'manage_users' },
  ];

  const handleNavigation = (page: Page) => {
    setActivePage(page);
    if (window.innerWidth < 1024) { // Close sidebar on mobile after navigation
        setIsOpen(false);
    }
  };

  return (
    <aside className={`fixed top-0 right-0 h-full w-64 glass-card text-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 lg:shadow-none no-print`}>
        <div className="p-4 flex justify-between items-center border-b border-[var(--border-glow)]">
             <h1 className="text-2xl font-bold text-center text-[var(--accent-cyan)] drop-shadow-[0_0_5px_var(--accent-cyan)]">M-SHOP OS</h1>
             <button onClick={() => setIsOpen(false)} className="lg:hidden text-[var(--text-secondary)] hover:text-white">
                 <XIcon className="w-6 h-6" />
             </button>
        </div>
      <nav className="p-4">
        <ul>
          {navItems.map((item) => {
             if (!hasPermission(item.requiredPermission)) return null;
             const isActive = activePage === item.id;
             return (
                <li key={item.id}>
                <button
                    onClick={() => handleNavigation(item.id)}
                    className={`w-full flex items-center p-3 my-2 rounded-lg transition-all duration-300 relative overflow-hidden group ${
                    isActive
                        ? 'text-white shadow-md'
                        : 'text-[var(--text-secondary)] hover:bg-white/10 hover:text-white'
                    }`}
                >
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] opacity-30 animate-pulse-glow" style={{animationDuration: '4s'}}></div>}
                    <div className={`absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-[var(--accent-cyan)] to-[var(--accent-purple)] transition-transform duration-300 scale-y-0 group-hover:scale-y-100 ${isActive ? 'scale-y-100' : ''}`}></div>
                    <item.icon className={`w-6 h-6 me-3 transition-colors ${isActive ? 'text-[var(--accent-cyan)]' : ''}`} />
                    <span className="font-medium relative z-10">{item.label}</span>
                </button>
                </li>
             )
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;