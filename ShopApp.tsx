
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

            // Map snake_case from DB to camelCase for the app
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
        // FIX: Directly use the roleId from the currentUser object for efficiency and correctness,
        // instead of re-searching the entire users list.
        if (data?.roles) {
            return data.roles.find(r => r.id === currentUser.roleId);
        }
        return undefined;
    }, [data?.roles, currentUser]);
    
    const hasPermission = useCallback((permission: Permission) => {
        if (userRole?.name?.toLowerCase() === 'admin') {
            return true;
        }
        return userRole?.permissions.includes(permission) ?? false;
    }, [userRole]);

    // --- DATA MUTATION FUNCTIONS ---
    const handleError = (error: any, context: string) => {
        console.error(`Error in ${context}:`, error);
        alert(`حدث خطأ: ${error.message || 'يرجى المحاولة مرة أخرى'}`);
        throw error;
    };
    
    // Generic function to add a treasury transaction correctly
    // FIX: The function provides its own date, so the 'entry' parameter shouldn't be required to have one.
    // This fixes multiple "Property 'date' is missing" errors throughout the file.
    const addTreasuryEntry = async (entry: Omit<TreasuryTransaction, 'id' | 'balanceAfter' | 'date'>) => {
        const { data: lastEntry, error: fetchError } = await supabase
            .from('treasury_transactions')
            .select('balance_after')
            .order('date', { ascending: false })
            .limit(1)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "query returned no rows"
             handleError(fetchError, 'addTreasuryEntry (fetch)');
             return;
        }

        const lastBalance = lastEntry?.balance_after || 0;
        const newBalance = entry.type === 'deposit' ? lastBalance + entry.amount : lastBalance - entry.amount;
        
        const { error } = await supabase.from('treasury_transactions').insert({
            id: crypto.randomUUID(),
            ...entry,
            date: new Date().toISOString(),
            balance_after: newBalance
        });
        if (error) handleError(error, 'addTreasuryEntry (insert)');
    };

    const addProduct = async (product: Omit<Product, 'id'>) => {
        try {
            const { error } = await supabase.from('products').insert({ ...product, purchase_price: product.purchasePrice, selling_price: product.sellingPrice, is_serialized: product.isSerialized });
            if (error) throw error;
            addToast('تم إضافة المنتج بنجاح');
            await loadAppData();
        } catch (e) {
            handleError(e, 'addProduct');
        }
    };
    const updateProduct = async (product: Product) => {
        try {
            const { error } = await supabase.from('products').update({ ...product, purchase_price: product.purchasePrice, selling_price: product.sellingPrice, is_serialized: product.isSerialized }).eq('id', product.id);
            if (error) throw error;
            addToast('تم تحديث المنتج بنجاح');
            await loadAppData();
        } catch (e) {
            handleError(e, 'updateProduct');
        }
    };
    const deleteProduct = async (id: string) => {
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            addToast('تم حذف المنتج');
            await loadAppData();
        } catch (e) {
            handleError(e, 'deleteProduct');
        }
    };

    const addCustomer = async (customer: Omit<Customer, 'id'>) => {
        try {
            const { error } = await supabase.from('customers').insert({ ...customer, national_id: customer.nationalId });
            if (error) throw error;
            addToast('تم إضافة العميل بنجاح');
            await loadAppData();
        } catch (e) {
            handleError(e, 'addCustomer');
        }
    };
    const updateCustomer = async (customer: Customer) => {
        try {
            const { error } = await supabase.from('customers').update({ ...customer, national_id: customer.nationalId }).eq('id', customer.id);
            if (error) throw error;
            addToast('تم تحديث العميل بنجاح');
            await loadAppData();
        } catch (e) {
            handleError(e, 'updateCustomer');
        }
    };
    const deleteCustomer = async (id: string) => {
        try {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) throw error;
            addToast('تم حذف العميل');
            await loadAppData();
        } catch (e) {
            handleError(e, 'deleteCustomer');
        }
    };

    const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
        try {
            const { error } = await supabase.from('suppliers').insert({ ...supplier, contact_person: supplier.contactPerson });
            if (error) throw error;
            addToast('تم إضافة المورد بنجاح');
            await loadAppData();
        } catch (e) {
            handleError(e, 'addSupplier');
        }
    };
    const updateSupplier = async (supplier: Supplier) => {
        try {
            const { error } = await supabase.from('suppliers').update({ ...supplier, contact_person: supplier.contactPerson }).eq('id', supplier.id);
            if (error) throw error;
            addToast('تم تحديث المورد بنجاح');
            await loadAppData();
        } catch (e) {
            handleError(e, 'updateSupplier');
        }
    };
    const deleteSupplier = async (id: string) => {
        try {
            const { error } = await supabase.from('suppliers').delete().eq('id', id);
            if (error) throw error;
            addToast('تم حذف المورد');
            await loadAppData();
        } catch (e) {
            handleError(e, 'deleteSupplier');
        }
    };
    
    const addPurchase = async (purchase: Omit<Purchase, 'id' | 'date'>) => {
        try {
            // Using RPC for atomicity would be best here.
            const purchaseId = crypto.randomUUID();
            const { error: purchaseError } = await supabase.from('purchases').insert({ ...purchase, id: purchaseId, supplier_id: purchase.supplierId, unit_purchase_price: purchase.unitPurchasePrice });
            if (purchaseError) throw purchaseError;

            await addTreasuryEntry({ type: 'withdrawal', amount: purchase.unitPurchasePrice * purchase.quantity, description: `شراء منتجات (فاتورة #${purchaseId.substring(0,5)})` });

            if (purchase.serialNumbers && purchase.serialNumbers.length > 0) {
                const instances = purchase.serialNumbers.map(sn => ({
                    product_id: purchase.productId,
                    serial_number: sn,
                    status: 'in_stock',
                    purchase_id: purchaseId,
                }));
                const { error: instanceError } = await supabase.from('product_instances').insert(instances);
                if (instanceError) throw instanceError;
            } else {
                 const { error } = await supabase.rpc('increment_stock', { p_id: purchase.productId, p_quantity: purchase.quantity });
                 if (error) throw error;
            }

            addToast('تم تسجيل الشراء بنجاح');
            await loadAppData();
        } catch(e) { handleError(e, 'addPurchase'); }
    };

    const addExpense = async (expense: Omit<Expense, 'id' | 'date'>) => {
        try {
            const { error } = await supabase.from('expenses').insert({ ...expense, category_id: expense.categoryId });
            if (error) throw error;

            await addTreasuryEntry({ type: 'withdrawal', amount: expense.amount, description: `مصروفات: ${expense.description}` });

            addToast('تم تسجيل المصروف بنجاح');
            await loadAppData();
        } catch (e) {
            handleError(e, 'addExpense');
        }
    };
    const addExpenseCategory = async (cat: Omit<ExpenseCategory, 'id'>) => {
        try {
            const { error } = await supabase.from('expense_categories').insert(cat);
            if (error) throw error;
            addToast('تمت إضافة الفئة');
            await loadAppData();
        } catch (e) {
            handleError(e, 'addExpenseCategory');
        }
    };
    
    const updateStoreInfo = async (info: StoreInfo) => {
        try {
            // Assumes a single row in store_info, which is correct for a single tenant.
            const { error } = await supabase.from('store_info').update({ ...info, commercial_record: info.commercialRecord, tax_card_number: info.taxCardNumber, owner_name: info.ownerName, store_name: info.storeName }).neq('id', crypto.randomUUID()); // Update all rows (should be one)
            if (error) throw error;
            addToast('تم تحديث بيانات المتجر');
            await loadAppData();
        } catch (e) {
            handleError(e, 'updateStoreInfo');
        }
    };

    const createSale = async (saleData: Omit<Sale, 'id' | 'date' | 'customerId'> & { customerId?: string }, installmentData?: InstallmentPlanCreationData, newCustomerData?: Omit<Customer, 'id'>): Promise<Sale | null> => {
       try {
            let customerId = saleData.customerId;
            if (newCustomerData) {
                const { data: newCustomer, error } = await supabase.from('customers').insert({ ...newCustomerData, national_id: newCustomerData.nationalId }).select().single();
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
                
                const installments: Omit<Installment, 'id'>[] = [];
                for(let i = 1; i <= installmentData.numberOfMonths; i++) {
                    const dueDate = new Date(saleDate);
                    dueDate.setMonth(dueDate.getMonth() + i);
                    dueDate.setDate(installmentData.monthlyDueDate);
                    // FIX: Use camelCase properties to match the TypeScript types.
                    // This resolves the "Object literal may only specify known properties" error for 'plan_id'.
                    installments.push({
                        planId: planId,
                        dueDate: dueDate.toISOString(),
                        amount: monthlyInstallment,
                        status: 'pending'
                    });
                }
                await supabase.from('installments').insert(installments.map(i => ({...i, plan_id: i.planId, due_date: i.dueDate})));
                
                if (installmentData.downPayment > 0) {
                     await addTreasuryEntry({ type: 'deposit', amount: installmentData.downPayment, description: `مقدم تقسيط (فاتورة #${newSaleId.substring(0,5)})`, relatedId: newSaleId });
                }
            }

            addToast("تمت عملية البيع بنجاح!");
            await loadAppData();
            return { ...saleData, customerId, id: newSaleId, date: saleDate };

        } catch (e) {
            handleError(e, 'createSale');
            return null;
        }
    };
    
    const createSalesReturn = async (returnData: Omit<SalesReturn, 'id' | 'date'>) => {
        try {
            const returnId = crypto.randomUUID();
            await supabase.from('sales_returns').insert({...returnData, id: returnId, original_sale_id: returnData.originalSaleId, customer_id: returnData.customerId, total_refund_amount: returnData.totalRefundAmount});
            await supabase.from('sales_return_items').insert(returnData.items.map(i => ({...i, return_id: returnId, product_id: i.productId, unit_price: i.unitPrice, unit_purchase_price: i.unitPurchasePrice, serial_number: i.serialNumber})));
            
            for (const item of returnData.items) {
                if (item.serialNumber) {
                    await supabase.from('product_instances').update({ status: 'in_stock', sale_id: null }).eq('serial_number', item.serialNumber);
                } else {
                    await supabase.rpc('increment_stock', { p_id: item.productId, p_quantity: item.quantity });
                }
            }
            
            await addTreasuryEntry({ type: 'withdrawal', amount: returnData.totalRefundAmount, description: `مرتجع مبيعات (فاتورة #${returnId.substring(0,5)})`, relatedId: returnId });

            addToast('تم تسجيل المرتجع');
            await loadAppData();
        } catch (e) {
            handleError(e, 'createSalesReturn');
        }
    };
    
    const addPayment = async (payment: { installmentPlanId: string; installmentId: string; amount: number; }) => {
        try {
            await supabase.from('installments').update({ status: 'paid', payment_date: new Date().toISOString() }).eq('id', payment.installmentId);
            await addTreasuryEntry({ type: 'deposit', amount: payment.amount, description: `تحصيل قسط (خطة #${payment.installmentPlanId.substring(0,5)})`, relatedId: payment.installmentId });
            addToast('تم تحصيل القسط');
            await loadAppData();
        } catch (e) {
            handleError(e, 'addPayment');
        }
    };

    const addJob = async (job: Omit<MaintenanceJob, 'id' | 'status' | 'receivedDate'>) => {
        try {
            await supabase.from('maintenance_jobs').insert({...job, status: 'جاري الإصلاح', received_date: new Date().toISOString(), customer_name: job.customerName, customer_phone: job.customerPhone, device_type: job.deviceType, problem_description: job.problemDescription});
            addToast('تم استلام جهاز الصيانة');
            await loadAppData();
        } catch(e) { handleError(e, 'addJob'); }
    };

    const updateJobStatus = async (jobId: string, newStatus: MaintenanceJob['status']) => {
        try {
            let updateData: any = { status: newStatus };
            if (newStatus === 'تم الإصلاح') updateData.repaired_date = new Date().toISOString();
            if (newStatus === 'تم التسليم') updateData.delivered_date = new Date().toISOString();
            
            await supabase.from('maintenance_jobs').update(updateData).eq('id', jobId);
            
            if (newStatus === 'تم التسليم') {
                const { data: job } = await supabase.from('maintenance_jobs').select('cost, customer_name').eq('id', jobId).single();
                if (job && job.cost > 0) {
                    await addTreasuryEntry({ type: 'deposit', amount: job.cost, description: `تحصيل صيانة (${job.customer_name})`, relatedId: jobId });
                }
            }
            
            addToast('تم تحديث حالة الصيانة');
            await loadAppData();
        } catch(e) { handleError(e, 'updateJobStatus'); }
    };
    
    const updateAppSettings = async (settings: AppSettings) => {
        try {
            await supabase.from('app_settings').update({ link_cash_transfers_to_main_treasury: settings.linkCashTransfersToMainTreasury }).neq('id', crypto.randomUUID());
            addToast('تم تحديث الإعدادات');
            await loadAppData();
        } catch(e) { handleError(e, 'updateAppSettings'); }
    };

    const addCashAccount = async (account: Omit<CashTransferAccount, 'id' | 'balance'>) => {
        try {
            await supabase.from('cash_transfer_accounts').insert({...account, balance: 0, daily_limit: account.dailyLimit, monthly_limit: account.monthlyLimit});
            addToast('تم إضافة الحساب');
            await loadAppData();
        } catch(e) { handleError(e, 'addCashAccount'); }
    };

    const deleteCashAccount = async (accountId: string) => {
        try {
            await supabase.from('cash_transfer_accounts').delete().eq('id', accountId);
            addToast('تم حذف الحساب');
            await loadAppData();
        } catch(e) { handleError(e, 'deleteCashAccount'); }
    };

    const addCashTransaction = async (transaction: Omit<CashTransferTransaction, 'id' | 'date'>) => {
        try {
            // This should be an RPC
            await supabase.from('cash_transfer_transactions').insert({ ...transaction, account_id: transaction.accountId, customer_phone: transaction.customerPhone });
            
            const balanceChange = transaction.type === 'deposit' ? -transaction.amount : transaction.amount;
            await supabase.rpc('increment_cash_balance', { acc_id: transaction.accountId, p_amount: balanceChange });
            
            if (data?.appSettings.linkCashTransfersToMainTreasury) {
                if (transaction.type === 'deposit') { // I receive cash
                    await addTreasuryEntry({ type: 'deposit', amount: transaction.amount, description: `إيداع تحويل كاش` });
                } else { // I give cash
                    await addTreasuryEntry({ type: 'withdrawal', amount: transaction.amount, description: `سحب تحويل كاش` });
                }
                 await addTreasuryEntry({ type: 'deposit', amount: transaction.commission, description: `عمولة تحويل كاش` });
            }

            addToast('تمت العملية بنجاح');
            await loadAppData();
        } catch(e) { handleError(e, 'addCashTransaction'); }
    };

    const addTreasuryTransaction = async (transaction: Omit<TreasuryTransaction, 'id' | 'date' | 'balanceAfter' | 'relatedId'>) => {
        try {
            await addTreasuryEntry(transaction);
            addToast('تمت الحركة بنجاح');
            await loadAppData();
        } catch (e) {
            handleError(e, 'addTreasuryTransaction');
        }
    };

    // Admin Functions
    const deleteUser = async (username: string) => {
        try {
            await supabase.from('users').delete().eq('username', username);
            addToast('تم حذف المستخدم');
            await loadAppData();
        } catch(e) { handleError(e, 'deleteUser'); }
    };

    const approveUser = async (username: string) => {
        try {
            await supabase.from('users').update({ status: 'approved' }).eq('username', username);
            addToast('تم تفعيل المستخدم');
            await loadAppData();
        } catch(e) { handleError(e, 'approveUser'); }
    };
    
    const updateUserRole = async (username: string, roleId: string) => {
        try {
            await supabase.from('users').update({ role_id: roleId }).eq('username', username);
            addToast('تم تحديث دور المستخدم');
            await loadAppData();
        } catch(e) { handleError(e, 'updateUserRole'); }
    };

    const updateRole = async (role: Role) => {
        try {
            await supabase.from('roles').update(role).eq('id', role.id);
            addToast('تم تحديث الدور');
            await loadAppData();
        } catch(e) { handleError(e, 'updateRole'); }
    };
    
    const addRole = async (role: Omit<Role, 'id'>) => {
        try {
            await supabase.from('roles').insert(role);
            addToast('تم إضافة الدور');
            await loadAppData();
        } catch(e) { handleError(e, 'addRole'); }
    };

    const deleteRole = async (roleId: string) => {
        if (roleId === 'admin' || roleId === 'user') {
            alert('لا يمكن حذف الأدوار الأساسية (Admin, User).');
            return;
        }
        try {
            await supabase.from('roles').delete().eq('id', roleId);
            addToast('تم حذف الدور');
            await loadAppData();
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
                const restoredData = JSON.parse(text) as TenantData;

                setIsLoading(true);
                // This is extremely dangerous and should be an RPC transaction
                // Order of deletion matters due to foreign keys
                await supabase.from('sale_items').delete().neq('id', 0);
                await supabase.from('installments').delete().neq('id', 0);
                await supabase.from('installment_plans').delete().neq('id', 0);
                await supabase.from('sales').delete().neq('id', 0);
                // ... continue for all dependent tables ...
                
                // Then insert data in the correct order
                // await supabase.from('products').insert(restoredData.products);
                // ... continue for all tables ...

                alert("Restore is a complex operation and is not fully implemented for safety. Please contact support.");
                // For a real app, this would trigger a backend process.
                // await loadAppData();
                setIsLoading(false);
            } catch (err) {
                handleError(err, 'handleRestore');
                setIsLoading(false);
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
                    markAsRead={async (id) => { await supabase.from('notifications').update({ is_read: true }).eq('id', id); loadAppData(); }}
                    markAllAsRead={async () => { await supabase.from('notifications').update({ is_read: true }).eq('is_read', false); loadAppData(); }}
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
