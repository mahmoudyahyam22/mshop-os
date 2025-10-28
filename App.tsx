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


const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('mshop_isAuthenticated', false);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('mshop_currentUser', null);
    const [systemError, setSystemError] = useState<string | null>(null);
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

    // System health check on startup
    useEffect(() => {
        const checkSystemHealth = async () => {
            if (!supabase) {
                setSystemError("فشل الاتصال بقاعدة البيانات. يرجى مراجعة إعدادات `config.ts`.");
                setIsLoadingSystem(false);
                return;
            }
            try {
                // Check if the essential roles exist in the database.
                const { error, count } = await supabase
                    .from('roles')
                    .select('id', { count: 'exact', head: true })
                    .in('id', ['admin', 'user']);
                
                if (error) throw error;
                
                if (count === null || count < 2) {
                     setSystemError("الأدوار الأساسية ('Admin', 'User') غير موجودة في قاعدة البيانات. هذا يمنع المستخدمين الجدد من التسجيل ويعطل النظام.");
                }
            } catch (error: any) {
                console.error("System Health Check Failed:", error);
                setSystemError(`فشل التحقق من سلامة النظام: ${error.message}`);
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
    
    if (systemError) {
        return <SystemSetupError message={systemError} sqlScript={ROLES_SEED_SQL} />;
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
