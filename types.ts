// FIX: Replaced placeholder content with a fully functional App component.
export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number; // For non-serialized items
  isSerialized: boolean;
  barcode?: string;
}

export interface ProductInstance {
    id: string;
    productId: string;
    serialNumber: string;
    status: 'in_stock' | 'sold' | 'returned';
    purchaseId: string;
    saleId?: string;
    returnId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  nationalId: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  address?: string;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  unitPurchasePrice: number;
  serialNumber?: string; // For serialized items
}

export interface Sale {
  id: string;
  customerId?: string; // Made optional for cash sales
  items: SaleItem[];
  totalAmount: number; // Cash value of items
  profit: number;
  date: string;
  paymentType: 'cash' | 'installment';
}

export interface Purchase {
  id:string;
  supplierId?: string;
  productId: string;
  quantity: number;
  unitPurchasePrice: number;
  date: string;
  serialNumbers?: string[]; // For serialized items
}

export interface SalesReturnItem {
  productId: string;
  quantity: number;
  unitPrice: number; // Price at which it was sold
  unitPurchasePrice: number; // Cost of the item, needed for profit calculation
  serialNumber?: string;
}

export interface SalesReturn {
  id: string;
  originalSaleId: string;
  customerId?: string;
  items: SalesReturnItem[];
  totalRefundAmount: number;
  date: string;
}

// A single scheduled payment within a plan
export interface Installment {
    id: string;
    // FIX: Add planId to link an installment to its parent plan.
    planId: string;
    dueDate: string;
    amount: number;
    status: 'pending' | 'paid';
    paymentDate?: string;
}

export interface InstallmentPlan {
  id: string;
  saleId: string;
  customerId: string;

  principalAmount: number; // Same as sale.totalAmount
  interestRate: number; // e.g., 15 for 15%
  interestAmount: number;
  totalAmount: number; // principal + interest
  
  downPayment: number;
  remainingAmount: number; // totalAmount - downPayment
  
  numberOfMonths: number;
  monthlyInstallment: number;
  
  startDate: string;
  monthlyDueDate: number; // Day of the month (1-31)
  
  installments: Installment[]; // List of individual payments

  guarantorName: string;
  guarantorPhone: string;
  guarantorAddress: string;
  guarantorNationalId: string;
}

// Raw data from the sales form to create a new installment plan
export interface InstallmentPlanCreationData {
    downPayment: number;
    numberOfMonths: number;
    interestRate: number;
    monthlyDueDate: number;
    guarantorName: string;
    guarantorPhone: string;
    guarantorAddress: string;
    guarantorNationalId: string;
}

export interface TreasuryTransaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  date: string;
  balanceAfter: number;
  relatedId?: string; // saleId, purchaseId, paymentId etc.
}

export interface MaintenanceJob {
  id: string;
  customerName: string;
  customerPhone: string;
  deviceType: string;
  problemDescription: string;
  status: 'جاري الإصلاح' | 'تم الإصلاح' | 'تم التسليم';
  receivedDate: string;
  repairedDate?: string;
  deliveredDate?: string;
  cost: number;
}

export interface StoreInfo {
  storeName: string;
  ownerName: string;
  phone: string;
  address: string;
  commercialRecord: string;
  taxCardNumber: string;
}

export interface CashTransferAccount {
  id: string;
  name: string; // e.g., "فودافون كاش 1"
  number: string;
  provider: string; // e.g., "Vodafone", "Orange"
  balance: number;
  dailyLimit: number;
  monthlyLimit: number;
}

export interface CashTransferTransaction {
  id: string;
  accountId: string;
  type: 'deposit' | 'withdrawal'; // إيداع أو سحب
  amount: number;
  commission: number; // الربح
  customerPhone?: string;
  date: string;
}

export interface AppSettings {
  linkCashTransfersToMainTreasury: boolean;
}

export interface ExpenseCategory {
    id: string;
    name: string;
}

export interface Expense {
    id: string;
    categoryId: string;
    description: string;
    amount: number;
    date: string;
}

export type Page = 'dashboard' | 'products' | 'customers' | 'sales' | 'purchases' | 'installments' | 'reports' | 'admin' | 'treasury' | 'maintenance' | 'storeInfo' | 'cashTransfers' | 'expenses' | 'suppliers' | 'returns' | 'superadmin';

export type NotificationType = 'low_stock' | 'installment_overdue' | 'installment_upcoming' | 'success' | 'user_registered';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  timestamp: string;
  linkTo?: Page; // Optional page to navigate to
  relatedId?: string; // e.g., product.id or installment.id
}

export type Permission = 
  | 'view_dashboard'
  | 'manage_products'
  | 'view_purchase_price'
  | 'perform_sales'
  | 'manage_installments'
  | 'manage_purchases'
  | 'manage_customers'
  | 'manage_maintenance'
  | 'manage_treasury'
  | 'manage_cash_transfers'
  | 'manage_expenses'
  | 'view_reports'
  | 'manage_store_info'
  | 'manage_users'
  | 'manage_roles'
  | 'manage_suppliers'
  | 'manage_returns'
  | 'perform_backup_restore';

export const ALL_PERMISSIONS: { id: Permission, label: string }[] = [
    { id: 'view_dashboard', label: 'عرض لوحة التحكم' },
    { id: 'manage_products', label: 'إدارة المنتجات' },
    { id: 'view_purchase_price', label: 'عرض سعر الشراء' },
    { id: 'perform_sales', label: 'إجراء عمليات البيع' },
    { id: 'manage_purchases', label: 'إدارة المشتريات' },
    { id: 'manage_installments', label: 'إدارة الأقساط' },
    { id: 'manage_customers', label: 'إدارة العملاء' },
    { id: 'manage_maintenance', label: 'إدارة الصيانة' },
    { id: 'manage_treasury', label: 'إدارة الخزنة' },
    { id: 'manage_cash_transfers', label: 'إدارة تحويلات الكاش' },
    { id: 'manage_expenses', label: 'إدارة المصروفات' },
    { id: 'view_reports', label: 'عرض التقارير' },
    { id: 'manage_store_info', label: 'إدارة بيانات المتجر' },
    { id: 'manage_users', label: 'إدارة المستخدمين' },
    { id: 'manage_roles', label: 'إدارة الأدوار والصلاحيات' },
    { id: 'manage_suppliers', label: 'إدارة الموردين' },
    { id: 'manage_returns', label: 'إدارة المرتجعات' },
    { id: 'perform_backup_restore', label: 'النسخ الاحتياطي والاستعادة'},
];

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export interface User {
  username: string;
  email: string;
  passwordHash: string;
  roleId: string;
  status: 'pending' | 'approved';
}

// Represents the entire dataset for a single tenant
export interface TenantData {
    products: Product[];
    productInstances: ProductInstance[];
    customers: Customer[];
    suppliers: Supplier[];
    sales: Sale[];
    purchases: Purchase[];
    salesReturns: SalesReturn[];
    installmentPlans: InstallmentPlan[];
    maintenanceJobs: MaintenanceJob[];
    treasuryTransactions: TreasuryTransaction[];
    cashTransferAccounts: CashTransferAccount[];
    cashTransferTransactions: CashTransferTransaction[];
    cashTransferTreasury: TreasuryTransaction[];
    expenses: Expense[];
    expenseCategories: ExpenseCategory[];
    storeInfo: StoreInfo;
    users: User[]; // Users within a single tenant's business
    roles: Role[];
    notifications: Notification[];
    appSettings: AppSettings;
}