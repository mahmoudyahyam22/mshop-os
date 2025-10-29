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

    const SCHEMA_MIGRATION_SQL = `-- هذا السكربت الشامل يقوم بتهيئة أو تحديث قاعدة البيانات بالكامل.
-- السكربت آمن للتنفيذ عدة مرات، سيقوم فقط بإنشاء أو تعديل ما هو غير موجود أو غير صحيح.

BEGIN;

-- =================================================================
-- ENUMS (إنشاء الأنواع المخصصة بشكل آمن)
-- =================================================================
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN CREATE TYPE public.product_status AS ENUM ('in_stock', 'sold', 'returned'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'installment_status') THEN CREATE TYPE public.installment_status AS ENUM ('pending', 'paid'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'treasury_transaction_type') THEN CREATE TYPE public.treasury_transaction_type AS ENUM ('deposit', 'withdrawal'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_status') THEN CREATE TYPE public.maintenance_status AS ENUM ('جاري الإصلاح', 'تم الإصلاح', 'تم التسليم'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cash_transfer_type') THEN CREATE TYPE public.cash_transfer_type AS ENUM ('deposit', 'withdrawal'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN CREATE TYPE public.user_status AS ENUM ('pending', 'approved'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_payment_type') THEN CREATE TYPE public.sale_payment_type AS ENUM ('cash', 'installment'); END IF; END $$;

-- =================================================================
-- TABLES (إنشاء الجداول وإضافة الأعمدة الناقصة)
-- =================================================================

CREATE TABLE IF NOT EXISTS public.products (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, brand TEXT NOT NULL, description TEXT, purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00, selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00, stock INT NOT NULL DEFAULT 0, is_serialized BOOLEAN NOT NULL DEFAULT false, barcode TEXT UNIQUE, created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_serialized BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.customers (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, address TEXT, national_id TEXT UNIQUE, created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS national_id TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS public.suppliers (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, contact_person TEXT, phone TEXT NOT NULL, address TEXT, created_at TIMESTAMPTZ DEFAULT now() NOT NULL);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS contact_person TEXT;

CREATE TABLE IF NOT EXISTS public.expense_categories (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE);

CREATE TABLE IF NOT EXISTS public.expenses (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), category_id TEXT REFERENCES public.expense_categories(id) ON DELETE SET NULL, description TEXT NOT NULL, amount NUMERIC(10, 2) NOT NULL, date TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.sales (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL, total_amount NUMERIC(10, 2) NOT NULL, profit NUMERIC(10, 2) NOT NULL, payment_type public.sale_payment_type NOT NULL, date TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.sale_items (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), sale_id TEXT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE, product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT, quantity INT NOT NULL, unit_price NUMERIC(10, 2) NOT NULL, unit_purchase_price NUMERIC(10, 2) NOT NULL, serial_number TEXT);
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS serial_number TEXT;

CREATE TABLE IF NOT EXISTS public.purchases (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL, product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT, quantity INT NOT NULL, unit_purchase_price NUMERIC(10, 2) NOT NULL, date TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.sales_returns (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), original_sale_id TEXT NOT NULL REFERENCES public.sales(id) ON DELETE RESTRICT, customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL, total_refund_amount NUMERIC(10, 2) NOT NULL, date TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.product_instances (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, serial_number TEXT NOT NULL UNIQUE, status public.product_status NOT NULL, purchase_id TEXT REFERENCES public.purchases(id) ON DELETE SET NULL, sale_id TEXT REFERENCES public.sales(id) ON DELETE SET NULL, return_id TEXT REFERENCES public.sales_returns(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now() NOT NULL);

CREATE TABLE IF NOT EXISTS public.sales_return_items (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), return_id TEXT NOT NULL REFERENCES public.sales_returns(id) ON DELETE CASCADE, product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT, quantity INT NOT NULL, unit_price NUMERIC(10, 2) NOT NULL, unit_purchase_price NUMERIC(10, 2) NOT NULL, serial_number TEXT);
ALTER TABLE public.sales_return_items ADD COLUMN IF NOT EXISTS serial_number TEXT;

CREATE TABLE IF NOT EXISTS public.installment_plans (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), sale_id TEXT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE, customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE, principal_amount NUMERIC(10, 2) NOT NULL, interest_rate NUMERIC(5, 2) NOT NULL, interest_amount NUMERIC(10, 2) NOT NULL, total_amount NUMERIC(10, 2) NOT NULL, down_payment NUMERIC(10, 2) NOT NULL, remaining_amount NUMERIC(10, 2) NOT NULL, number_of_months INT NOT NULL, monthly_installment NUMERIC(10, 2) NOT NULL, start_date DATE NOT NULL, monthly_due_date INT NOT NULL, guarantor_name TEXT, guarantor_phone TEXT, guarantor_address TEXT, guarantor_national_id TEXT);
ALTER TABLE public.installment_plans ADD COLUMN IF NOT EXISTS guarantor_name TEXT;
ALTER TABLE public.installment_plans ADD COLUMN IF NOT EXISTS guarantor_phone TEXT;
ALTER TABLE public.installment_plans ADD COLUMN IF NOT EXISTS guarantor_address TEXT;
ALTER TABLE public.installment_plans ADD COLUMN IF NOT EXISTS guarantor_national_id TEXT;

CREATE TABLE IF NOT EXISTS public.installments (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), plan_id TEXT NOT NULL REFERENCES public.installment_plans(id) ON DELETE CASCADE, due_date DATE NOT NULL, amount NUMERIC(10, 2) NOT NULL, status public.installment_status NOT NULL DEFAULT 'pending', payment_date TIMESTAMPTZ);

CREATE TABLE IF NOT EXISTS public.treasury_transactions (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), type public.treasury_transaction_type NOT NULL, amount NUMERIC(10, 2) NOT NULL, description TEXT NOT NULL, date TIMESTAMPTZ NOT NULL DEFAULT now(), balance_after NUMERIC(12, 2) NOT NULL, related_id TEXT);

CREATE TABLE IF NOT EXISTS public.maintenance_jobs (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL, device_type TEXT NOT NULL, problem_description TEXT NOT NULL, status public.maintenance_status NOT NULL DEFAULT 'جاري الإصلاح', received_date TIMESTAMPTZ NOT NULL DEFAULT now(), repaired_date TIMESTAMPTZ, delivered_date TIMESTAMPTZ, cost NUMERIC(10, 2) NOT NULL);

CREATE TABLE IF NOT EXISTS public.cash_transfer_accounts (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, number TEXT NOT NULL, provider TEXT NOT NULL, balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00, daily_limit NUMERIC(10, 2) NOT NULL DEFAULT 30000, monthly_limit NUMERIC(10, 2) NOT NULL DEFAULT 100000);

CREATE TABLE IF NOT EXISTS public.cash_transfer_transactions (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), account_id TEXT NOT NULL REFERENCES public.cash_transfer_accounts(id) ON DELETE CASCADE, type public.cash_transfer_type NOT NULL, amount NUMERIC(10, 2) NOT NULL, commission NUMERIC(10, 2) NOT NULL DEFAULT 0.00, customer_phone TEXT, date TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.roles (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, permissions JSONB NOT NULL);

CREATE TABLE IF NOT EXISTS public.users (username TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT, status public.user_status NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now() NOT NULL);

CREATE TABLE IF NOT EXISTS public.notifications (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), type TEXT NOT NULL, message TEXT NOT NULL, is_read BOOLEAN NOT NULL DEFAULT false, timestamp TIMESTAMPTZ NOT NULL DEFAULT now(), link_to TEXT, related_id TEXT);

CREATE TABLE IF NOT EXISTS public.store_info (id BOOLEAN PRIMARY KEY DEFAULT TRUE, store_name TEXT, owner_name TEXT, phone TEXT, address TEXT, commercial_record TEXT, tax_card_number TEXT, CONSTRAINT single_row_constraint CHECK (id = TRUE));

CREATE TABLE IF NOT EXISTS public.app_settings (id BOOLEAN PRIMARY KEY DEFAULT TRUE, link_cash_transfers_to_main_treasury BOOLEAN NOT NULL DEFAULT false, CONSTRAINT single_row_constraint CHECK (id = TRUE));

-- =================================================================
-- FUNCTIONS (RPCs - تحديث الدوال الذكية)
-- =================================================================

CREATE OR REPLACE FUNCTION public.add_purchase_transaction(p_product_id text, p_quantity integer, p_unit_price numeric, p_supplier_id text DEFAULT NULL, p_serial_numbers text[] DEFAULT ARRAY[]::text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_purchase_id text; v_is_serialized boolean; v_serial text; v_total_cost numeric; v_product_name text; v_current_balance numeric;
BEGIN
    SELECT is_serialized, name INTO v_is_serialized, v_product_name FROM public.products WHERE id = p_product_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;
    IF v_is_serialized AND array_length(p_serial_numbers, 1) IS DISTINCT FROM p_quantity THEN RAISE EXCEPTION 'Serial number count mismatch'; END IF;
    INSERT INTO public.purchases (product_id, quantity, unit_purchase_price, supplier_id) VALUES (p_product_id, p_quantity, p_unit_price, p_supplier_id) RETURNING id INTO v_purchase_id;
    IF v_is_serialized THEN FOREACH v_serial IN ARRAY p_serial_numbers LOOP INSERT INTO public.product_instances (product_id, serial_number, status, purchase_id) VALUES (p_product_id, v_serial, 'in_stock', v_purchase_id); END LOOP;
    ELSE UPDATE public.products SET stock = stock + p_quantity WHERE id = p_product_id; END IF;
    v_total_cost := p_quantity * p_unit_price;
    IF v_total_cost > 0 THEN
        v_current_balance := COALESCE((SELECT balance_after FROM public.treasury_transactions ORDER BY date DESC, id DESC LIMIT 1), 0);
        INSERT INTO public.treasury_transactions (type, amount, description, related_id, balance_after) VALUES ('withdrawal', v_total_cost, 'شراء ' || p_quantity || ' من ' || v_product_name, v_purchase_id, v_current_balance - v_total_cost);
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_sale_transaction(p_items jsonb, p_total_amount numeric, p_profit numeric, p_payment_type text, p_customer_id text DEFAULT NULL, p_new_customer jsonb DEFAULT NULL, p_installment_data jsonb DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_sale_id text; v_customer_id text := p_customer_id; item record; v_current_balance numeric;
BEGIN
    IF p_new_customer IS NOT NULL THEN INSERT INTO public.customers (name, phone, address, national_id) VALUES (p_new_customer->>'name', p_new_customer->>'phone', p_new_customer->>'address', p_new_customer->>'nationalId') RETURNING id INTO v_customer_id; END IF;
    INSERT INTO public.sales (customer_id, total_amount, profit, payment_type) VALUES (v_customer_id, p_total_amount, p_profit, p_payment_type::public.sale_payment_type) RETURNING id INTO v_sale_id;
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x("productId" text, quantity int, "unitPrice" numeric, "unitPurchasePrice" numeric, "serialNumber" text)
    LOOP
        INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, unit_purchase_price, serial_number) VALUES (v_sale_id, item."productId", item.quantity, item."unitPrice", item."unitPurchasePrice", item."serialNumber");
        IF item."serialNumber" IS NOT NULL AND item."serialNumber" != '' THEN UPDATE public.product_instances SET status = 'sold', sale_id = v_sale_id WHERE serial_number = item."serialNumber";
        ELSE UPDATE public.products SET stock = stock - item.quantity WHERE id = item."productId"; END IF;
    END LOOP;
    v_current_balance := COALESCE((SELECT balance_after FROM public.treasury_transactions ORDER BY date DESC, id DESC LIMIT 1), 0);
    IF p_payment_type = 'cash' THEN INSERT INTO public.treasury_transactions (type, amount, description, related_id, balance_after) VALUES ('deposit', p_total_amount, 'بيع نقدي فاتورة #' || substring(v_sale_id, 1, 8), v_sale_id, v_current_balance + p_total_amount);
    ELSIF p_payment_type = 'installment' AND p_installment_data IS NOT NULL THEN
        DECLARE v_plan_id text; v_down_payment numeric := (p_installment_data->>'downPayment')::numeric; v_interest_rate numeric := (p_installment_data->>'interestRate')::numeric; v_num_months int := (p_installment_data->>'numberOfMonths')::int; v_due_day int := (p_installment_data->>'monthlyDueDate')::int; v_interest_amount numeric := (p_total_amount - v_down_payment) * (v_interest_rate / 100); v_total_debt numeric := p_total_amount + v_interest_amount; v_remaining numeric := v_total_debt - v_down_payment; v_monthly_payment numeric := CASE WHEN v_num_months > 0 THEN v_remaining / v_num_months ELSE 0 END; i int;
        BEGIN
            INSERT INTO public.installment_plans (sale_id, customer_id, principal_amount, interest_rate, interest_amount, total_amount, down_payment, remaining_amount, number_of_months, monthly_installment, start_date, monthly_due_date, guarantor_name, guarantor_phone, guarantor_address, guarantor_national_id) VALUES (v_sale_id, v_customer_id, p_total_amount, v_interest_rate, v_interest_amount, v_total_debt, v_down_payment, v_remaining, v_num_months, v_monthly_payment, now(), v_due_day, p_installment_data->>'guarantorName', p_installment_data->>'guarantorPhone', p_installment_data->>'guarantorAddress', p_installment_data->>'guarantorNationalId') RETURNING id INTO v_plan_id;
            FOR i IN 1..v_num_months LOOP INSERT INTO public.installments (plan_id, due_date, amount, status) VALUES (v_plan_id, (now() + (i || ' months')::interval)::date, v_monthly_payment, 'pending'); END LOOP;
            IF v_down_payment > 0 THEN INSERT INTO public.treasury_transactions (type, amount, description, related_id, balance_after) VALUES ('deposit', v_down_payment, 'مقدم تقسيط فاتورة #' || substring(v_sale_id, 1, 8), v_sale_id, v_current_balance + v_down_payment); END IF;
        END;
    END IF;
    RETURN v_sale_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_return_transaction(p_original_sale_id text, p_customer_id text, p_total_refund_amount numeric, p_items jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_return_id text; item record; v_current_balance numeric;
BEGIN
    INSERT INTO public.sales_returns (original_sale_id, customer_id, total_refund_amount) VALUES (p_original_sale_id, p_customer_id, p_total_refund_amount) RETURNING id INTO v_return_id;
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x("productId" text, quantity int, "unitPrice" numeric, "unitPurchasePrice" numeric, "serialNumber" text)
    LOOP
        INSERT INTO public.sales_return_items (return_id, product_id, quantity, unit_price, unit_purchase_price, serial_number) VALUES (v_return_id, item."productId", item.quantity, item."unitPrice", item."unitPurchasePrice", item."serialNumber");
        IF item."serialNumber" IS NOT NULL AND item."serialNumber" != '' THEN UPDATE public.product_instances SET status = 'in_stock', sale_id = NULL, return_id = v_return_id WHERE serial_number = item."serialNumber";
        ELSE UPDATE public.products SET stock = stock + item.quantity WHERE id = item."productId"; END IF;
    END LOOP;
    IF p_total_refund_amount > 0 THEN
        v_current_balance := COALESCE((SELECT balance_after FROM public.treasury_transactions ORDER BY date DESC, id DESC LIMIT 1), 0);
        INSERT INTO public.treasury_transactions (type, amount, description, related_id, balance_after) VALUES ('withdrawal', p_total_refund_amount, 'مرتجع فاتورة #' || substring(p_original_sale_id, 1, 8), v_return_id, v_current_balance - p_total_refund_amount);
    END IF;
    RETURN v_return_id;
END;
$$;

COMMIT;`;

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