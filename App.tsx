import React, { useState, useEffect } from 'react';
import type { User } from './types';
import { supabase } from './supabaseClient'; // Import supabase client
import { DatabaseIcon } from './components/icons';

// Import Pages
import Auth from './pages/Auth';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ShopApp from './ShopApp'; // The component that runs the tenant's application

// A custom hook to persist state in localStorage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue] as const;
}

// Helper function to convert snake_case object keys to camelCase, matching the app's type definitions.
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

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-screen w-screen bg-[var(--bg-dark-primary)]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[var(--accent-cyan)]"></div>
    </div>
);

const SystemSetupError: React.FC<{ message: string; sqlScript: string }> = ({ message, sqlScript }) => (
    <div className="flex flex-col justify-center items-center h-screen w-screen p-4 bg-gradient-to-br from-red-900/20 via-[var(--bg-dark-primary)] to-[var(--bg-dark-primary)] text-[var(--text-primary)]">
        <div className="glass-card p-8 rounded-lg text-center max-w-4xl animate-fadeInUp border-2 border-red-500/50 shadow-2xl shadow-red-500/20">
            <DatabaseIcon className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h1 className="text-3xl font-bold text-red-400 mb-4">خطأ حرج في إعداد قاعدة البيانات</h1>
            <p className="text-lg mb-6 text-[var(--text-secondary)]">
                {message}
            </p>
            <p className="mb-4 font-semibold">لحل المشكلة، يرجى تنفيذ كود SQL التالي مباشرة في محرر Supabase الخاص بمشروعك:</p>
            <div className="text-left bg-black/50 p-4 rounded-md font-mono text-sm text-gray-300 relative">
                <button
                    onClick={() => navigator.clipboard.writeText(sqlScript)}
                    className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded"
                >
                    نسخ
                </button>
                <pre className="whitespace-pre-wrap"><code>{sqlScript}</code></pre>
            </div>
             <p className="mt-6 text-sm text-gray-500">
                بعد تنفيذ الكود بنجاح، قم بتحديث هذه الصفحة.
            </p>
        </div>
    </div>
);

const SchemaMigrationError: React.FC<{ message: string; sqlScript: string }> = ({ message, sqlScript }) => (
    <div className="flex flex-col justify-center items-center h-screen w-screen p-4 bg-gradient-to-br from-orange-900/20 via-[var(--bg-dark-primary)] to-[var(--bg-dark-primary)] text-[var(--text-primary)]">
        <div className="glass-card p-8 rounded-lg text-center max-w-4xl animate-fadeInUp border-2 border-orange-500/50 shadow-2xl shadow-orange-500/20">
            <DatabaseIcon className="w-16 h-16 mx-auto mb-4 text-orange-400" />
            <h1 className="text-3xl font-bold text-orange-400 mb-4">تحديث مطلوب لقاعدة البيانات</h1>
            <p className="text-lg mb-6 text-[var(--text-secondary)]">
                {message}
            </p>
            <p className="mb-4 font-semibold">لحل المشكلة، يرجى تنفيذ كود SQL التالي مباشرة في محرر Supabase الخاص بمشروعك (Database &gt; SQL Editor):</p>
            <div className="text-left bg-black/50 p-4 rounded-md font-mono text-sm text-gray-300 relative">
                <button
                    onClick={() => navigator.clipboard.writeText(sqlScript)}
                    className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded"
                >
                    نسخ
                </button>
                <pre className="whitespace-pre-wrap"><code>{sqlScript}</code></pre>
            </div>
             <p className="mt-6 text-sm text-gray-500">
                بعد تنفيذ الكود بنجاح، قم بتحديث هذه الصفحة.
            </p>
        </div>
    </div>
);


const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('mshop_isAuthenticated', false);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('mshop_currentUser', null);
    const [systemError, setSystemError] = useState<string | null>(null);
    const [schemaError, setSchemaError] = useState<string | null>(null);
    const [isLoadingSystem, setIsLoadingSystem] = useState(true);

    const ROLES_SEED_SQL = `-- This robust, transactional script repairs and seeds the essential user roles,
-- handling both foreign key and unique name constraint issues.

BEGIN;

-- Step 1: Temporarily rename any existing 'Admin' or 'User' roles that have incorrect IDs.
-- This frees up the names 'Admin' and 'User' to avoid unique constraint violations.
-- We append '_legacy_' and the old ID to make the name unique and identifiable.
UPDATE public.roles
SET name = name || '_legacy_' || id
WHERE name IN ('Admin', 'User') AND id NOT IN ('admin', 'user');

-- Step 2: Safely insert or update the correct 'admin' and 'user' roles.
-- ON CONFLICT (id) ensures that if the correct roles already exist, they are updated
-- with the correct name and permissions, making the script re-runnable.
INSERT INTO public.roles (id, name, permissions)
VALUES
(
    'admin',
    'Admin',
    '{
        "view_dashboard", "manage_products", "view_purchase_price", "perform_sales",
        "manage_purchases", "manage_installments", "manage_customers", "manage_maintenance",
        "manage_treasury", "manage_cash_transfers", "manage_expenses", "view_reports",
        "manage_store_info", "manage_users", "manage_roles", "manage_suppliers",
        "manage_returns", "perform_backup_restore"
    }'
),
(
    'user',
    'User',
    '{
        "view_dashboard", "manage_products", "perform_sales", "manage_purchases",
        "manage_installments", "manage_customers", "manage_maintenance", "manage_treasury",
        "manage_cash_transfers", "manage_expenses", "manage_suppliers", "manage_returns"
    }'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    permissions = EXCLUDED.permissions;

-- Step 3: Re-assign any users who are still linked to the temporarily renamed legacy roles.
-- This resolves the foreign key constraint that would prevent deleting the old roles.
UPDATE public.users
SET role_id = 'admin'
WHERE role_id IN (SELECT id FROM public.roles WHERE name LIKE 'Admin_legacy_%');

UPDATE public.users
SET role_id = 'user'
WHERE role_id IN (SELECT id FROM public.roles WHERE name LIKE 'User_legacy_%');

-- Step 4: With all users migrated, the old legacy roles are no longer referenced and can be safely deleted.
DELETE FROM public.roles WHERE name LIKE 'Admin_legacy_%';
DELETE FROM public.roles WHERE name LIKE 'User_legacy_%';

COMMIT;`;

    const SCHEMA_MIGRATION_SQL = `-- هذا السكربت الشامل يقوم بتحديث قاعدة البيانات لتدعم كافة ميزات التطبيق.
-- السكربت آمن للتنفيذ عدة مرات.

BEGIN;

-- ===== الخطوة 1: إضافة الأعمدة الناقصة للجداول الحالية =====

-- إضافة عمود لتحديد ما إذا كان المنتج يتطلب رقمًا تسلسليًا
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_serialized BOOLEAN NOT NULL DEFAULT false;

-- إضافة عمود الرقم القومي للعملاء، وهو مهم للأقساط
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS national_id TEXT;

-- إضافة عمود لجهة الاتصال للموردين
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS contact_person TEXT;

-- إضافة عمود الرقم التسلسلي لعناصر فواتير البيع
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- إضافة عمود الرقم التسلسلي لعناصر فواتير المرتجعات
ALTER TABLE public.sales_return_items ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- إضافة أعمدة بيانات الضامن لخطط الأقساط
ALTER TABLE public.installment_plans ADD COLUMN IF NOT EXISTS guarantor_name TEXT;
ALTER TABLE public.installment_plans ADD COLUMN IF NOT EXISTS guarantor_phone TEXT;
ALTER TABLE public.installment_plans ADD COLUMN IF NOT EXISTS guarantor_address TEXT;
ALTER TABLE public.installment_plans ADD COLUMN IF NOT EXISTS guarantor_national_id TEXT;

-- ===== الخطوة 2: إنشاء جدول جديد لتتبع القطع ذات الأرقام التسلسلية =====

-- إنشاء جدول لتخزين كل قطعة فريدة من منتج له رقم تسلسلي
CREATE TABLE IF NOT EXISTS public.product_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    serial_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('in_stock', 'sold', 'returned')),
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    return_id UUID REFERENCES public.sales_returns(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- إنشاء فهارس لتحسين أداء البحث
CREATE INDEX IF NOT EXISTS idx_product_instances_product_id ON public.product_instances(product_id);
CREATE INDEX IF NOT EXISTS idx_product_instances_status ON public.product_instances(status);


-- ===== الخطوة 3: إنشاء دالة ذكية لإدارة عمليات الشراء =====

-- هذه الدالة تعالج عملية الشراء بشكل آمن وتحديث المخزون والخزنة تلقائيًا
CREATE OR REPLACE FUNCTION public.add_purchase_transaction(
    p_product_id uuid,
    p_quantity integer,
    p_unit_price numeric,
    p_supplier_id uuid DEFAULT NULL,
    p_serial_numbers text[] DEFAULT ARRAY[]::text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_purchase_id uuid;
    v_is_serialized boolean;
    v_serial text;
    v_total_cost numeric;
    v_product_name text;
BEGIN
    -- 1. التحقق من نوع المنتج (عادي أم تسلسلي)
    SELECT is_serialized, name INTO v_is_serialized, v_product_name FROM public.products WHERE id = p_product_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', p_product_id;
    END IF;

    -- 2. التحقق من تطابق كمية الأرقام التسلسلية مع الكمية المشتراة
    IF v_is_serialized AND array_length(p_serial_numbers, 1) IS DISTINCT FROM p_quantity THEN
        RAISE EXCEPTION 'عدد الأرقام التسلسلية (%) لا يطابق الكمية (%) للمنتج ذي الرقم التسلسلي.', array_length(p_serial_numbers, 1), p_quantity;
    END IF;

    -- 3. تسجيل عملية الشراء في جدول المشتريات
    INSERT INTO public.purchases (product_id, quantity, unit_purchase_price, supplier_id, date)
    VALUES (p_product_id, p_quantity, p_unit_price, p_supplier_id, now())
    RETURNING id INTO v_purchase_id;

    -- 4. تحديث المخزون حسب نوع المنتج
    IF v_is_serialized THEN
        -- للمنتجات التسلسلية، يتم إنشاء سجل لكل قطعة في جدول product_instances
        FOREACH v_serial IN ARRAY p_serial_numbers LOOP
            INSERT INTO public.product_instances (product_id, serial_number, status, purchase_id)
            VALUES (p_product_id, v_serial, 'in_stock', v_purchase_id);
        END LOOP;
    ELSE
        -- للمنتجات العادية، يتم زيادة الكمية في المخزون الرئيسي
        UPDATE public.products
        SET stock = stock + p_quantity
        WHERE id = p_product_id;
    END IF;

    -- 5. تسجيل حركة سحب من الخزنة بقيمة المشتريات
    v_total_cost := p_quantity * p_unit_price;
    IF v_total_cost > 0 THEN
        INSERT INTO public.treasury_transactions (type, amount, description, related_id, balance_after, date)
        SELECT
            'withdrawal',
            v_total_cost,
            'شراء ' || p_quantity || ' من ' || v_product_name,
            v_purchase_id,
            (COALESCE((SELECT balance_after FROM public.treasury_transactions ORDER BY date DESC, id DESC LIMIT 1), 0) - v_total_cost),
            now();
    END IF;
END;
$$;

COMMIT;
`;

    // System health check on startup
    useEffect(() => {
        const checkSystemHealth = async () => {
            if (!supabase) {
                setSystemError("فشل الاتصال بقاعدة البيانات. يرجى مراجعة إعدادات `config.ts`.");
                setIsLoadingSystem(false);
                return;
            }
            try {
                // Check 1: Essential roles existence.
                const { error: rolesError, count } = await supabase
                    .from('roles')
                    .select('id', { count: 'exact', head: true })
                    .in('id', ['admin', 'user']);
                
                if (rolesError) throw rolesError;
                
                if (count === null || count < 2) {
                     setSystemError("الأدوار الأساسية ('Admin', 'User') غير موجودة في قاعدة البيانات. هذا يمنع المستخدمين الجدد من التسجيل ويعطل النظام.");
                }

                // Check 2: Schema (columns) existence.
                const checks = [
                    supabase.from('products').select('is_serialized').limit(1),
                    supabase.from('customers').select('national_id').limit(1),
                    supabase.from('suppliers').select('contact_person').limit(1)
                ];
                const results = await Promise.all(checks);
                const columnError = results.find(res => res.error && (res.error.message.includes('column') || res.error.message.includes('does not exist')));
                
                if (columnError) {
                    setSchemaError("يبدو أن قاعدة بياناتك غير محدّثة. بعض الأعمدة الهامة مفقودة، مما يسبب أخطاء في عمليات الحفظ والاسترجاع. يرجى تحديث مخطط قاعدة البيانات الخاصة بك.");
                }

            } catch (error: any) {
                console.error("System Health Check Failed:", error);
                if (!systemError && !schemaError) {
                    setSystemError(`فشل التحقق من سلامة النظام: ${error.message}`);
                }
            } finally {
                setIsLoadingSystem(false);
            }
        };

        checkSystemHealth();
    }, []);
    
    // --- AUTHENTICATION for the entire platform using Supabase ---
    const handleLogin = async (username: string, password: string): Promise<{ success: boolean, message: string }> => {
        if (!supabase) return { success: false, message: 'Database connection not configured.' };
    
        try {
            // Call a database function (RPC) to handle login securely on the server.
            const { data, error } = await supabase.rpc('login_user', {
                p_username: username,
                p_password: password
            });
    
            if (error) throw error;
    
            // The RPC returns a JSON object with success status, message, and user data if successful.
            if (data && data.success) {
                // Convert the raw user object from the DB (snake_case) to the app's format (camelCase).
                const userFromDb: User = toCamelCase(data.user);

                // Explicitly check for 'approved' status as per requirements.
                if (userFromDb.status !== 'approved') {
                    return { success: false, message: 'حسابك قيد المراجعة ولم يتم تفعيله بعد.' };
                }

                setCurrentUser(userFromDb);
                setIsAuthenticated(true);
                return { success: true, message: 'Login successful' };
            } else {
                return { success: false, message: data.message || 'Invalid username or password.' };
            }
        } catch (error: any) {
            console.error("Login RPC failed. Full error object:", error);
            let message = 'فشل تسجيل الدخول. يرجى التحقق من بياناتك أو الاتصال بالدعم.';
            if (error && error.message) {
                message = `فشل تسجيل الدخول: ${error.message}`;
            }
            return { success: false, message };
        }
    };
    
    const handleRegister = async (username: string, email: string, password: string): Promise<{ success: boolean; message: string; }> => {
        if (!supabase) return { success: false, message: 'Database connection not configured.' };
    
        try {
            const { data, error: rpcError } = await supabase.rpc('register_user', {
                p_username: username,
                p_email: email,
                p_password: password
            });
    
            if (rpcError) throw rpcError;
            
            if (data && data.success) {
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message || 'فشل التسجيل لسبب غير معروف.' };
            }
    
        } catch (error: any) {
            console.error("Registration failed:", JSON.stringify(error, null, 2));
    
            let userMessage = error.message || 'فشل التسجيل. يرجى المحاولة مرة أخرى لاحقاً.';
            if (error.message?.includes('duplicate key value violates unique constraint')) {
                userMessage = 'اسم المستخدم أو البريد الإلكتروني مسجل بالفعل.';
            } else if (error.message?.includes('violates foreign key constraint "users_role_id_fkey"')) {
                userMessage = 'خطأ في إعداد النظام: الدور الافتراضي للمستخدم غير موجود. يرجى التأكد من أن قاعدة البيانات مهيأة بشكل صحيح.';
            }
            
            return { success: false, message: userMessage };
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setIsAuthenticated(false);
    };

    // --- Render Logic ---
    if (isLoadingSystem) {
        return <LoadingSpinner />;
    }
    
    // Prioritize critical setup errors first
    if (systemError) {
        return <SystemSetupError message={systemError} sqlScript={ROLES_SEED_SQL} />;
    }
    
    // Then show schema migration errors
    if (schemaError) {
        return <SchemaMigrationError message={schemaError} sqlScript={SCHEMA_MIGRATION_SQL} />;
    }

    if (!isAuthenticated || !currentUser) {
        return <Auth onLogin={handleLogin} onRegister={handleRegister} />;
    }

    if (currentUser.username.toLowerCase() === 'superadmin') {
        return <SuperAdminDashboard onLogout={handleLogout} />;
    }

    // For any other authenticated user, render their isolated shop application
    return <ShopApp currentUser={currentUser} onLogout={handleLogout} />;
};

export default App;