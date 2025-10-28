
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type {
    Page,
    User,
    TenantData,
    Product,
    Customer,
    Sale,
    Purchase,
    InstallmentPlan,
    TreasuryTransaction,
    MaintenanceJob,
    CashTransferAccount,
    CashTransferTransaction,
    Expense,
    Supplier,
    SalesReturn,
    Permission,
    Installment,
    InstallmentPlanCreationData,
    ProductInstance,
    Notification,
    Role,
    ExpenseCategory,
    AppSettings,
    StoreInfo,
    SalesReturnItem
} from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient'; // Import the Supabase client and config status
import { ALL_PERMISSIONS } from './types';

// Import Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Installments from './pages/Installments';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import Treasury from './pages/Treasury';
import Maintenance from './pages/Maintenance';
import StoreInfoPage from './pages/StoreInfo';
import CashTransfers from './pages/CashTransfers';
import Expenses from './pages/Expenses';
import Suppliers from './pages/Suppliers';
import Returns from './pages/Returns';

// Import Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';

interface ShopAppProps {
    currentUser: User;
    onLogout: () => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-screen w-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[var(--accent-cyan)]"></div>
    </div>
);

const SupabaseConfigError: React.FC = () => (
    <div className="flex flex-col justify-center items-center h-screen w-screen p-4 bg-gradient-to-br from-[var(--bg-dark-primary)] to-[var(--bg-dark-secondary)] text-[var(--text-primary)]">
        <div className="glass-card p-8 rounded-lg text-center max-w-2xl animate-fadeInUp">
            <h1 className="text-3xl font-bold text-red-500 mb-4">خطأ في الإعداد</h1>
            <p className="text-lg mb-2">
                بيانات الاتصال بقاعدة البيانات (Supabase) غير مهيأة.
            </p>
            <p className="text-[var(--text-secondary)] mb-6">
                لإصلاح هذا، يرجى فتح ملف `config.ts` في كود المشروع واستبدال القيم المؤقتة بالرابط والمفتاح الخاصين بمشروعك على Supabase.
            </p>
            <div className="text-left bg-black/20 p-4 rounded-md font-mono text-sm">
                <p><span className="text-purple-400">export const</span> <span className="text-blue-400">SUPABASE_URL</span> = <span className="text-green-400">"https://your-project-ref.supabase.co"</span>;</p>
                <p><span className="text-purple-400">export const</span> <span className="text-blue-400">SUPABASE_ANON_KEY</span> = <span className="text-green-400">"your-supabase-anon-key"</span>;</p>
            </div>
            <p className="mt-6 text-sm text-[var(--text-secondary)]">
                يمكنك العثور على هذه البيانات في لوحة تحكم مشروعك في Supabase تحت <span className="font-bold">Settings &gt; API</span>.
            </p>
        </div>
    </div>
);

// Helper function to convert snake_case object keys to camelCase.
const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(v => toCamelCase(v));
    if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
};


const ShopApp: React.FC<ShopAppProps> = ({ currentUser, onLogout }) => {
    const [data, setData] = useState<TenantData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activePage, setActivePage] = useState<Page>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' }[]>([]);

    if (!isSupabaseConfigured || !supabase) {
        return <SupabaseConfigError />;
    }

    const addToast = (message: string, type: 'success' = 'success') => {
        const id = new Date().getTime();
        setToasts(prev => [...prev, { id, message, type }]);
    };
    
    const loadAppData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch all data in parallel
            const [
                productsRes, productInstancesRes, customersRes, suppliersRes, salesRes, saleItemsRes,
                purchasesRes, salesReturnsRes, salesReturnItemsRes, installmentPlansRes, installmentsRes,
                maintenanceJobsRes, treasuryTransactionsRes, cashTransferAccountsRes, cashTransferTransactionsRes,
                expensesRes, expenseCategoriesRes, storeInfoRes, usersRes, rolesRes, notificationsRes, appSettingsRes
            ] = await Promise.all([
                supabase.from('products').select('*'),
                supabase.from('product_instances').select('*'),
                supabase.from('customers').select('*'),
                supabase.from('suppliers').select('*'),
                supabase.from('sales').select('*'),
                supabase.from('sale_items').select('*'),
                supabase.from('purchases').select('*'),
                supabase.from('sales_returns').select('*'),
                supabase.from('sales_return_items').select('*'),
                supabase.from('installment_plans').select('*'),
                supabase.from('installments').select('*'),
                supabase.from('maintenance_jobs').select('*'),
                supabase.from('treasury_transactions').select('*').order('date', { ascending: true }),
                supabase.from('cash_transfer_accounts').select('*'),
                supabase.from('cash_transfer_transactions').select('*').order('date', { ascending: false }),
                supabase.from('expenses').select('*'),
                supabase.from('expense_categories').select('*'),
                supabase.from('store_info').select('*').single(),
                supabase.from('users').select('*'),
                supabase.from('roles').select('*'),
                supabase.from('notifications').select('*'),
                supabase.from('app_settings').select('*').single(),
            ]);

            // Compose nested data structures
            const salesWithItems = (salesRes.data || []).map(sale => ({
                ...sale,
                items: (saleItemsRes.data || []).filter(item => item.sale_id === sale.id)
            }));
            const returnsWithItems = (salesReturnsRes.data || []).map(ret => ({
                ...ret,
                items: (salesReturnItemsRes.data || []).filter(item => item.return_id === ret.id)
            }));
            const plansWithInstallments = (installmentPlansRes.data || []).map(plan => ({
                ...plan,
                installments: (installmentsRes.data || []).filter(inst => inst.plan_id === plan.id)
            }));

            const fullData: TenantData = {
                products: toCamelCase(productsRes.data || []),
                productInstances: toCamelCase(productInstancesRes.data || []),
                customers: toCamelCase(customersRes.data || []),
                suppliers: toCamelCase(suppliersRes.data || []),
                sales: toCamelCase(salesWithItems),
                purchases: toCamelCase(purchasesRes.data || []),
                salesReturns: toCamelCase(returnsWithItems),
                installmentPlans: toCamelCase(plansWithInstallments),
                maintenanceJobs: toCamelCase(maintenanceJobsRes.data || []),
                treasuryTransactions: toCamelCase(treasuryTransactionsRes.data || []),
                cashTransferAccounts: toCamelCase(cashTransferAccountsRes.data || []),
                cashTransferTransactions: toCamelCase(cashTransferTransactionsRes.data || []),
                cashTransferTreasury: [],
                expenses: toCamelCase(expensesRes.data || []),
                expenseCategories: toCamelCase(expenseCategoriesRes.data || []),
                storeInfo: toCamelCase(storeInfoRes.data),
                users: toCamelCase(usersRes.data || []),
                roles: toCamelCase(rolesRes.data || []),
                notifications: toCamelCase(notificationsRes.data || []),
                appSettings: toCamelCase(appSettingsRes.data),
            };

            setData(fullData);
        } catch (error) {
            console.error("Error loading application data:", error);
            alert("فشل تحميل بيانات التطبيق.");
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);


    useEffect(() => {
        loadAppData();
    }, [loadAppData]);

    const userRole = useMemo(() => {
        if (data?.roles) {
            return data.roles.find(r => r.id === currentUser.roleId);
        }
        return undefined;
    }, [data?.roles, currentUser]);
    
    const hasPermission = useCallback((permission: Permission) => {
        if (currentUser.username === 'superadmin' || userRole?.name?.toLowerCase() === 'admin') {
            return true;
        }
        return userRole?.permissions.includes(permission) ?? false;
    }, [userRole, currentUser]);

    // --- DATA MUTATION FUNCTIONS ---
    const handleError = (error: any, context: string) => {
        console.error(`Error in ${context}:`, error);
        const message = error?.message || 'An unexpected error occurred. Check the console for details.';
        alert(`حدث خطأ في ${context}: ${message}`);
    };
    
    const addTreasuryEntry = async (entry: Omit<TreasuryTransaction, 'id' | 'balanceAfter' | 'date'>) => {
        const lastBalance = data?.treasuryTransactions.at(-1)?.balanceAfter ?? 0;
        const newBalance = entry.type === 'deposit' ? lastBalance + entry.amount : lastBalance - entry.amount;

        const newTransaction: TreasuryTransaction = {
            id: crypto.randomUUID(),
            ...entry,
            date: new Date().toISOString(),
            balanceAfter: newBalance,
        };
        
        // Optimistic UI update
        setData(prev => prev ? { ...prev, treasuryTransactions: [...prev.treasuryTransactions, newTransaction] } : null);
        
        const { error } = await supabase.from('treasury_transactions').insert({
            ...newTransaction,
            balance_after: newTransaction.balanceAfter
        });

        if (error) {
            handleError(error, 'addTreasuryEntry (insert)');
            // On failure, reload to sync state with DB
            await loadAppData();
        }
    };
    
    const addProduct = async (product: Omit<Product, 'id'>) => {
        try {
            const productDataForDb = {
                name: product.name,
                brand: product.brand,
                description: product.description,
                purchase_price: product.purchasePrice,
                selling_price: product.sellingPrice,
                stock: product.stock,
                is_serialized: product.isSerialized,
                barcode: product.barcode,
            };
            const { data: newProductData, error } = await supabase.from('products').insert(productDataForDb).select().single();
            if (error) throw error;
            setData(prev => prev ? { ...prev, products: [...prev.products, toCamelCase(newProductData)] } : null);
            addToast('تم إضافة المنتج بنجاح');
        } catch (e) {
            handleError(e, 'addProduct');
        }
    };
    const updateProduct = async (product: Product) => {
        try {
            const productDataForDb = {
                name: product.name,
                brand: product.brand,
                description: product.description,
                purchase_price: product.purchasePrice,
                selling_price: product.sellingPrice,
                stock: product.stock,
                is_serialized: product.isSerialized,
                barcode: product.barcode,
            };
            const { data: updatedProductData, error } = await supabase.from('products').update(productDataForDb).eq('id', product.id).select().single();
            if (error) throw error;
            setData(prev => prev ? { ...prev, products: prev.products.map(p => p.id === product.id ? toCamelCase(updatedProductData) : p) } : null);
            addToast('تم تحديث المنتج بنجاح');
        } catch (e) {
            handleError(e, 'updateProduct');
        }
    };
    const deleteProduct = async (id: string) => {
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            setData(prev => prev ? { ...prev, products: prev.products.filter(p => p.id !== id) } : null);
            addToast('تم حذف المنتج');
        } catch (e) {
            handleError(e, 'deleteProduct');
        }
    };

    const addCustomer = async (customer: Omit<Customer, 'id'>) => {
        try {
            const customerDataForDb = {
                name: customer.name,
                phone: customer.phone,
                address: customer.address,
                national_id: customer.nationalId,
            };
            const { data: newCustomer, error } = await supabase.from('customers').insert(customerDataForDb).select().single();
            if (error) throw error;
            setData(prev => prev ? { ...prev, customers: [...prev.customers, toCamelCase(newCustomer)] } : null);
            addToast('تم إضافة العميل بنجاح');
        } catch (e) {
            handleError(e, 'addCustomer');
        }
    };
    const updateCustomer = async (customer: Customer) => {
        try {
            const { id, ...customerData } = customer;
            const customerDataForDb = {
                name: customerData.name,
                phone: customerData.phone,
                address: customerData.address,
                national_id: customerData.nationalId,
            };
            const { data: updatedCustomer, error } = await supabase.from('customers').update(customerDataForDb).eq('id', id).select().single();
            if (error) throw error;
            setData(prev => prev ? { ...prev, customers: prev.customers.map(c => c.id === customer.id ? toCamelCase(updatedCustomer) : c) } : null);
            addToast('تم تحديث العميل بنجاح');
        } catch (e) {
            handleError(e, 'updateCustomer');
        }
    };
    const deleteCustomer = async (id: string) => {
        try {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) throw error;
            setData(prev => prev ? { ...prev, customers: prev.customers.filter(c => c.id !== id) } : null);
            addToast('تم حذف العميل');
        } catch (e) {
            handleError(e, 'deleteCustomer');
        }
    };

    const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
        try {
            const supplierDataForDb = {
                name: supplier.name,
                contact_person: supplier.contactPerson,
                phone: supplier.phone,
                address: supplier.address,
            };
            const { data: newSupplier, error } = await supabase.from('suppliers').insert(supplierDataForDb).select().single();
            if (error) throw error;
            setData(prev => prev ? { ...prev, suppliers: [...prev.suppliers, toCamelCase(newSupplier)] } : null);
            addToast('تم إضافة المورد بنجاح');
        } catch (e) {
            handleError(e, 'addSupplier');
        }
    };
    const updateSupplier = async (supplier: Supplier) => {
        try {
            const { id, ...supplierData } = supplier;
            const supplierDataForDb = {
                name: supplierData.name,
                contact_person: supplierData.contactPerson,
                phone: supplierData.phone,
                address: supplierData.address,
            };
            const { data: updatedSupplier, error } = await supabase.from('suppliers').update(supplierDataForDb).eq('id', id).select().single();
            if (error) throw error;
            setData(prev => prev ? { ...prev, suppliers: prev.suppliers.map(s => s.id === supplier.id ? toCamelCase(updatedSupplier) : s) } : null);
            addToast('تم تحديث المورد بنجاح');
        } catch (e) {
            handleError(e, 'updateSupplier');
        }
    };
    const deleteSupplier = async (id: string) => {
        try {
            const { error } = await supabase.from('suppliers').delete().eq('id', id);
            if (error) throw error;
            setData(prev => prev ? { ...prev, suppliers: prev.suppliers.filter(s => s.id !== id) } : null);
            addToast('تم حذف المورد');
        } catch (e) {
            handleError(e, 'deleteSupplier');
        }
    };
    
    const addPurchase = async (purchase: Omit<Purchase, 'id' | 'date'>) => {
        try {
            await supabase.rpc('add_purchase_transaction', {
                p_supplier_id: purchase.supplierId,
                p_product_id: purchase.productId,
                p_quantity: purchase.quantity,
                p_unit_price: purchase.unitPurchasePrice,
                p_serial_numbers: purchase.serialNumbers
            });
            addToast('تم تسجيل الشراء بنجاح');
            await loadAppData(); // Reload for this complex transaction to ensure consistency
        } catch(e) { handleError(e, 'addPurchase'); }
    };

    const addExpense = async (expense: Omit<Expense, 'id' | 'date'>) => {
        try {
             const expenseDataForDb = {
                category_id: expense.categoryId,
                description: expense.description,
                amount: expense.amount,
            };
            const { data: newExpenseData, error } = await supabase.from('expenses').insert(expenseDataForDb).select().single();
            if (error) throw error;
            await addTreasuryEntry({ type: 'withdrawal', amount: expense.amount, description: `مصروفات: ${expense.description}` });
            setData(prev => prev ? { ...prev, expenses: [...prev.expenses, toCamelCase(newExpenseData)] } : null);
            addToast('تم تسجيل المصروف بنجاح');
        } catch (e) {
            handleError(e, 'addExpense');
        }
    };
    const addExpenseCategory = async (cat: Omit<ExpenseCategory, 'id'>) => {
        try {
            const { data: newCat, error } = await supabase.from('expense_categories').insert(cat).select().single();
            if (error) throw error;
            setData(prev => prev ? { ...prev, expenseCategories: [...prev.expenseCategories, toCamelCase(newCat)] } : null);
            addToast('تمت إضافة الفئة');
        } catch (e) {
            handleError(e, 'addExpenseCategory');
        }
    };
    
    const updateStoreInfo = async (info: StoreInfo) => {
        try {
            const infoForDb = {
                store_name: info.storeName,
                owner_name: info.ownerName,
                phone: info.phone,
                address: info.address,
                commercial_record: info.commercialRecord,
                tax_card_number: info.taxCardNumber,
            };
            const { data: updatedInfo, error } = await supabase.from('store_info').update(infoForDb).select().single();
            if (error) throw error;
            setData(prev => prev ? { ...prev, storeInfo: toCamelCase(updatedInfo) } : null);
            addToast('تم تحديث بيانات المتجر');
        } catch (e) {
            handleError(e, 'updateStoreInfo');
        }
    };

    const createSale = async (saleData: Omit<Sale, 'id' | 'date' | 'customerId'> & { customerId?: string }, installmentData?: InstallmentPlanCreationData, newCustomerData?: Omit<Customer, 'id'>): Promise<Sale | null> => {
       try {
            let customerId = saleData.customerId;
            if (newCustomerData) {
                const { data: newCustomer, error } = await supabase.from('customers').insert({ name: newCustomerData.name, phone: newCustomerData.phone, address: newCustomerData.address, national_id: newCustomerData.nationalId }).select().single();
                if (error || !newCustomer) throw error || new Error("Failed to create customer");
                customerId = newCustomer.id;
            }

            const newSaleId = crypto.randomUUID();
            const saleDate = new Date().toISOString();
            await supabase.from('sales').insert({
                id: newSaleId,
                customer_id: customerId,
                total_amount: saleData.totalAmount,
                profit: saleData.profit,
                date: saleDate,
                payment_type: saleData.paymentType
            });
            
            await supabase.from('sale_items').insert(saleData.items.map(item => ({
                sale_id: newSaleId,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                unit_purchase_price: item.unitPurchasePrice,
                serial_number: item.serialNumber
            })));
            
            for (const item of saleData.items) {
                if(item.serialNumber) {
                    await supabase.from('product_instances').update({ status: 'sold', sale_id: newSaleId }).eq('serial_number', item.serialNumber);
                } else {
                    await supabase.rpc('increment_stock', { p_id: item.productId, p_quantity: -item.quantity });
                }
            }
            
            if(saleData.paymentType === 'cash') {
                await addTreasuryEntry({ type: 'deposit', amount: saleData.totalAmount, description: `بيع نقدي (فاتورة #${newSaleId.substring(0,5)})`, relatedId: newSaleId });
            } else if (installmentData && customerId) {
                const principal = saleData.totalAmount;
                const interestAmount = (principal - installmentData.downPayment) * (installmentData.interestRate / 100);
                const totalAmount = principal + interestAmount;
                const remainingAmount = totalAmount - installmentData.downPayment;
                const monthlyInstallment = installmentData.numberOfMonths > 0 ? remainingAmount / installmentData.numberOfMonths : 0;
                
                const planId = crypto.randomUUID();
                await supabase.from('installment_plans').insert({
                    id: planId,
                    sale_id: newSaleId,
                    customer_id: customerId,
                    principal_amount: principal,
                    interest_rate: installmentData.interestRate,
                    interest_amount: interestAmount,
                    total_amount: totalAmount,
                    down_payment: installmentData.downPayment,
                    remaining_amount: remainingAmount,
                    number_of_months: installmentData.numberOfMonths,
                    monthly_installment: monthlyInstallment,
                    start_date: saleDate,
                    monthly_due_date: installmentData.monthlyDueDate,
                    guarantor_name: installmentData.guarantorName,
                    guarantor_phone: installmentData.guarantorPhone,
                    guarantor_address: installmentData.guarantorAddress,
                    guarantor_national_id: installmentData.guarantorNationalId,
                });
                
                const installments = [];
                for(let i = 1; i <= installmentData.numberOfMonths; i++) {
                    const dueDate = new Date(saleDate);
                    dueDate.setMonth(dueDate.getMonth() + i);
                    dueDate.setDate(installmentData.monthlyDueDate);
                    installments.push({
                        plan_id: planId,
                        due_date: dueDate.toISOString(),
                        amount: monthlyInstallment,
                        status: 'pending'
                    });
                }
                await supabase.from('installments').insert(installments);
                
                if (installmentData.downPayment > 0) {
                     await addTreasuryEntry({ type: 'deposit', amount: installmentData.downPayment, description: `مقدم تقسيط (فاتورة #${newSaleId.substring(0,5)})`, relatedId: newSaleId });
                }
            }

            addToast("تمت عملية البيع بنجاح!");
            await loadAppData(); // Reload for this complex transaction
            return { ...saleData, customerId, id: newSaleId, date: saleDate };

        } catch (e) {
            handleError(e, 'createSale');
            return null;
        }
    };
    
    const createSalesReturn = async (returnData: Omit<SalesReturn, 'id' | 'date'>) => {
        try {
            const returnId = crypto.randomUUID();
            const returnForDb = {
                id: returnId,
                original_sale_id: returnData.originalSaleId,
                customer_id: returnData.customerId,
                total_refund_amount: returnData.totalRefundAmount,
                date: new Date().toISOString()
            };
            await supabase.from('sales_returns').insert(returnForDb);

            const itemsForDb = returnData.items.map(i => ({
                return_id: returnId,
                product_id: i.productId,
                quantity: i.quantity,
                unit_price: i.unitPrice,
                unit_purchase_price: i.unitPurchasePrice,
                serial_number: i.serialNumber
            }));
            await supabase.from('sales_return_items').insert(itemsForDb);
            
            for (const item of returnData.items) {
                if (item.serialNumber) {
                    await supabase.from('product_instances').update({ status: 'in_stock', sale_id: null }).eq('serial_number', item.serialNumber);
                } else {
                    await supabase.rpc('increment_stock', { p_id: item.productId, p_quantity: item.quantity });
                }
            }
            
            await addTreasuryEntry({ type: 'withdrawal', amount: returnData.totalRefundAmount, description: `مرتجع مبيعات (فاتورة #${returnId.substring(0,5)})`, relatedId: returnId });

            addToast('تم تسجيل المرتجع');
            await loadAppData(); // Reload for this complex transaction
        } catch (e) {
            handleError(e, 'createSalesReturn');
        }
    };
    
    const addPayment = async (payment: { installmentPlanId: string; installmentId: string; amount: number; }) => {
        try {
            await supabase.from('installments').update({ status: 'paid', payment_date: new Date().toISOString() }).eq('id', payment.installmentId);
            await addTreasuryEntry({ type: 'deposit', amount: payment.amount, description: `تحصيل قسط (خطة #${payment.installmentPlanId.substring(0,5)})`, relatedId: payment.installmentId });
            addToast('تم تحصيل القسط');
            await loadAppData(); // Reload needed to update plan details correctly
        } catch (e) {
            handleError(e, 'addPayment');
        }
    };

    const addJob = async (job: Omit<MaintenanceJob, 'id' | 'status' | 'receivedDate'>) => {
        try {
             const jobForDb = {
                customer_name: job.customerName,
                customer_phone: job.customerPhone,
                device_type: job.deviceType,
                problem_description: job.problemDescription,
                cost: job.cost,
                status: 'جاري الإصلاح',
                received_date: new Date().toISOString()
            };
            const { data: newJobData, error } = await supabase.from('maintenance_jobs').insert(jobForDb).select().single();
            if(error) throw error;
            setData(prev => prev ? {...prev, maintenanceJobs: [...prev.maintenanceJobs, toCamelCase(newJobData)]} : null)
            addToast('تم استلام جهاز الصيانة');
        } catch(e) { handleError(e, 'addJob'); }
    };

    const updateJobStatus = async (jobId: string, newStatus: MaintenanceJob['status']) => {
        try {
            let updateData: any = { status: newStatus };
            if (newStatus === 'تم الإصلاح') updateData.repaired_date = new Date().toISOString();
            if (newStatus === 'تم التسليم') updateData.delivered_date = new Date().toISOString();
            
            const { data: updatedJobData, error } = await supabase.from('maintenance_jobs').update(updateData).eq('id', jobId).select().single();
            if (error) throw error;
            
            if (newStatus === 'تم التسليم' && updatedJobData.cost > 0) {
                 await addTreasuryEntry({ type: 'deposit', amount: updatedJobData.cost, description: `تحصيل صيانة (${updatedJobData.customer_name})`, relatedId: jobId });
            }
            
            setData(prev => prev ? {...prev, maintenanceJobs: prev.maintenanceJobs.map(j => j.id === jobId ? toCamelCase(updatedJobData) : j)}: null);
            addToast('تم تحديث حالة الصيانة');
        } catch(e) { handleError(e, 'updateJobStatus'); }
    };
    
    const updateAppSettings = async (settings: AppSettings) => {
        try {
             const settingsForDb = {
                link_cash_transfers_to_main_treasury: settings.linkCashTransfersToMainTreasury
            };
            const {data: updatedSettings, error} = await supabase.from('app_settings').update(settingsForDb).select().single();
            if (error) throw error;
            setData(prev => prev ? {...prev, appSettings: toCamelCase(updatedSettings)}: null);
            addToast('تم تحديث الإعدادات');
        } catch(e) { handleError(e, 'updateAppSettings'); }
    };

    const addCashAccount = async (account: Omit<CashTransferAccount, 'id' | 'balance'>) => {
        try {
             const accountForDb = {
                name: account.name,
                number: account.number,
                provider: account.provider,
                daily_limit: account.dailyLimit,
                monthly_limit: account.monthlyLimit,
                balance: 0,
            };
            const {data: newAccount, error} = await supabase.from('cash_transfer_accounts').insert(accountForDb).select().single();
            if (error) throw error;
            setData(prev => prev ? {...prev, cashTransferAccounts: [...prev.cashTransferAccounts, toCamelCase(newAccount)]} : null);
            addToast('تم إضافة الحساب');
        } catch(e) { handleError(e, 'addCashAccount'); }
    };

    const deleteCashAccount = async (accountId: string) => {
        try {
            await supabase.from('cash_transfer_accounts').delete().eq('id', accountId);
            setData(prev => prev ? {...prev, cashTransferAccounts: prev.cashTransferAccounts.filter(a => a.id !== accountId)} : null);
            addToast('تم حذف الحساب');
        } catch(e) { handleError(e, 'deleteCashAccount'); }
    };

    const addCashTransaction = async (transaction: Omit<CashTransferTransaction, 'id' | 'date'>) => {
        try {
             const transactionForDb = {
                account_id: transaction.accountId,
                type: transaction.type,
                amount: transaction.amount,
                commission: transaction.commission,
                customer_phone: transaction.customerPhone
            };
            await supabase.from('cash_transfer_transactions').insert(transactionForDb);
            
            const balanceChange = transaction.type === 'deposit' ? -transaction.amount : transaction.amount;
            await supabase.rpc('increment_cash_balance', { acc_id: transaction.accountId, p_amount: balanceChange });
            
            if (data?.appSettings.linkCashTransfersToMainTreasury) {
                if (transaction.type === 'deposit') {
                    await addTreasuryEntry({ type: 'deposit', amount: transaction.amount, description: `إيداع تحويل كاش` });
                } else {
                    await addTreasuryEntry({ type: 'withdrawal', amount: transaction.amount, description: `سحب تحويل كاش` });
                }
                 await addTreasuryEntry({ type: 'deposit', amount: transaction.commission, description: `عمولة تحويل كاش` });
            }

            addToast('تمت العملية بنجاح!');
            await loadAppData(); // Reload for this complex transaction
        } catch(e) { handleError(e, 'addCashTransaction'); }
    };

    const addTreasuryTransaction = async (transaction: Omit<TreasuryTransaction, 'id' | 'date' | 'balanceAfter' | 'relatedId'>) => {
        try {
            await addTreasuryEntry(transaction);
            addToast('تمت الحركة بنجاح');
        } catch (e) {
            handleError(e, 'addTreasuryTransaction');
        }
    };

    // Admin Functions
    const deleteUser = async (username: string) => {
        try {
            await supabase.from('users').delete().eq('username', username);
            setData(prev => prev ? {...prev, users: prev.users.filter(u => u.username !== username)} : null);
            addToast('تم حذف المستخدم');
        } catch(e) { handleError(e, 'deleteUser'); }
    };

    const approveUser = async (username: string) => {
        try {
            const {data: updatedUser, error} = await supabase.from('users').update({ status: 'approved' }).eq('username', username).select().single();
            if (error) throw error;
            setData(prev => prev ? {...prev, users: prev.users.map(u => u.username === username ? toCamelCase(updatedUser) : u)} : null);
            addToast('تم تفعيل المستخدم');
        } catch(e) { handleError(e, 'approveUser'); }
    };
    
    const updateUserRole = async (username: string, roleId: string) => {
        try {
            const {data: updatedUser, error} = await supabase.from('users').update({ role_id: roleId }).eq('username', username).select().single();
            if (error) throw error;
            setData(prev => prev ? {...prev, users: prev.users.map(u => u.username === username ? toCamelCase(updatedUser) : u)} : null);
            addToast('تم تحديث دور المستخدم');
        } catch(e) { handleError(e, 'updateUserRole'); }
    };

    const updateRole = async (role: Role) => {
        try {
            const {data: updatedRole, error} = await supabase.from('roles').update(role).eq('id', role.id).select().single();
            if (error) throw error;
            setData(prev => prev ? {...prev, roles: prev.roles.map(r => r.id === role.id ? toCamelCase(updatedRole) : r)} : null);
            addToast('تم تحديث الدور');
        } catch(e) { handleError(e, 'updateRole'); }
    };
    
    const addRole = async (role: Omit<Role, 'id'>) => {
        try {
            const {data: newRole, error} = await supabase.from('roles').insert(role).select().single();
            if (error) throw error;
            setData(prev => prev ? {...prev, roles: [...prev.roles, toCamelCase(newRole)]} : null);
            addToast('تم إضافة الدور');
        } catch(e) { handleError(e, 'addRole'); }
    };

    const deleteRole = async (roleId: string) => {
        if (roleId === 'admin' || roleId === 'user') {
            alert('لا يمكن حذف الأدوار الأساسية.');
            return;
        }
        try {
            await supabase.from('roles').delete().eq('id', roleId);
            setData(prev => prev ? {...prev, roles: prev.roles.filter(r => r.id !== roleId)} : null);
            addToast('تم حذف الدور');
        } catch(e) { handleError(e, 'deleteRole'); }
    };

    const handleBackup = () => {
        if (!data) return;
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `mshop_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        addToast('تم بدء تنزيل النسخة الاحتياطية');
    };

    const handleRestore = (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not text.");
                
                console.log("Restoring from backup is a complex backend process and is not fully implemented on the client-side for security and data integrity reasons.", JSON.parse(text));
                alert("تم استلام ملف الاستعادة. سيتم معالجته في الخلفية (محاكاة).");
                addToast('بدأت عملية الاستعادة');
                
            } catch (err) {
                handleError(err, 'handleRestore');
            }
        };
        reader.readAsText(file);
    };

    if (isLoading || !data) {
        return <LoadingSpinner />;
    }

    const renderPage = () => {
        if (!hasPermission('view_dashboard')) {
            return <div className="p-8"><p>ليس لديك الصلاحية لعرض هذا التطبيق.</p></div>;
        }
        switch (activePage) {
            case 'dashboard': return <Dashboard sales={data.sales} products={data.products} productInstances={data.productInstances} customers={data.customers} installmentPlans={data.installmentPlans} cashTransferTransactions={data.cashTransferTransactions} cashTransferAccounts={data.cashTransferAccounts} setActivePage={setActivePage} />;
            case 'products': return <Products products={data.products} productInstances={data.productInstances} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} hasPermission={hasPermission} />;
            case 'customers': return <Customers customers={data.customers} addCustomer={addCustomer} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} />;
            case 'suppliers': return <Suppliers suppliers={data.suppliers} addSupplier={addSupplier} updateSupplier={updateSupplier} deleteSupplier={deleteSupplier} />;
            case 'sales': return <Sales customers={data.customers} products={data.products} productInstances={data.productInstances} storeInfo={data.storeInfo} createSale={createSale} />;
            case 'purchases': return <Purchases products={data.products} purchases={data.purchases} suppliers={data.suppliers} addPurchase={addPurchase} />;
            case 'returns': return <Returns salesReturns={data.salesReturns} sales={data.sales} products={data.products} customers={data.customers} createSalesReturn={createSalesReturn} />;
            case 'installments': return <Installments installmentPlans={data.installmentPlans} customers={data.customers} addPayment={addPayment} />;
            case 'maintenance': return <Maintenance jobs={data.maintenanceJobs} addJob={addJob} updateJobStatus={updateJobStatus} />;
            case 'treasury': return <Treasury transactions={data.treasuryTransactions} addTransaction={addTreasuryTransaction} />;
            case 'cashTransfers': return <CashTransfers accounts={data.cashTransferAccounts} transactions={data.cashTransferTransactions} cashTransferTreasury={data.cashTransferTreasury} appSettings={data.appSettings} updateAppSettings={updateAppSettings} addAccount={addCashAccount} updateAccount={async()=>{}} deleteAccount={deleteCashAccount} addTransaction={addCashTransaction} />;
            case 'expenses': return <Expenses expenses={data.expenses} categories={data.expenseCategories} addExpense={addExpense} addCategory={addExpenseCategory} />;
            case 'storeInfo': return <StoreInfoPage storeInfo={data.storeInfo} onUpdate={updateStoreInfo} />;
            case 'reports': return <Reports sales={data.sales} products={data.products} productInstances={data.productInstances} purchases={data.purchases} expenses={data.expenses} installmentPlans={data.installmentPlans} treasuryTransactions={data.treasuryTransactions} salesReturns={data.salesReturns} />;
            case 'admin': return <Admin allUsers={data.users} currentUser={currentUser} roles={data.roles} deleteUser={deleteUser} approveUser={approveUser} updateUserRole={updateUserRole} updateRole={updateRole} addRole={addRole} deleteRole={deleteRole} handleBackup={handleBackup} handleRestore={handleRestore} />;
            default: return <div>الصفحة قيد الإنشاء...</div>;
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-[var(--bg-dark-primary)] to-[var(--bg-dark-secondary)] text-[var(--text-primary)] font-sans-ar">
            <Sidebar activePage={activePage} setActivePage={setActivePage} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} hasPermission={hasPermission} />
            <main className="flex-1 flex flex-col overflow-hidden lg:mr-64">
                <Header
                    onMenuButtonClick={() => setIsSidebarOpen(true)}
                    notifications={data.notifications}
                    markAsRead={async (id) => { 
                        await supabase.from('notifications').update({ is_read: true }).eq('id', id); 
                        setData(prev => prev ? {...prev, notifications: prev.notifications.map(n => n.id === id ? {...n, isRead: true} : n)} : null);
                    }}
                    markAllAsRead={async () => { 
                        await supabase.from('notifications').update({ is_read: true }).eq('is_read', false); 
                        setData(prev => prev ? {...prev, notifications: prev.notifications.map(n => ({...n, isRead: true}))} : null);
                    }}
                    setActivePage={setActivePage}
                    onLogout={onLogout}
                    globalSearchData={{ products: data.products, customers: data.customers, sales: data.sales }}
                />
                <div className="flex-1 overflow-x-hidden overflow-y-auto">
                    {renderPage()}
                </div>
            </main>
            <div className="fixed bottom-4 left-4 z-[100] space-y-3">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        {...toast}
                        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
                    />
                ))}
            </div>
        </div>
    );
};

export default ShopApp;
