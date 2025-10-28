import React, { useState, useEffect } from 'react';
import type { User } from './types';
import { supabase } from './supabaseClient'; // Import supabase client

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


const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('mshop_isAuthenticated', false);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('mshop_currentUser', null);
    
    // This effect runs once on startup to ensure essential data like roles exists.
    useEffect(() => {
        const seedInitialData = async () => {
            if (!supabase) return;
            try {
                // Check if roles table is empty
                const { count, error: countError } = await supabase.from('roles').select('*', { count: 'exact', head: true });
                if (countError) throw countError;

                if (count === 0) {
                    console.log("Roles table is empty. Seeding initial roles...");
                    const { error } = await supabase.from('roles').insert([
                        {
                            id: 'r1',
                            name: 'Admin',
                            permissions: [
                                "view_dashboard", "manage_products", "view_purchase_price", "perform_sales", "manage_purchases", "manage_installments", "manage_customers", "manage_maintenance", "manage_treasury", "manage_cash_transfers", "manage_expenses", "view_reports", "manage_store_info", "manage_users", "manage_roles", "manage_suppliers", "manage_returns", "perform_backup_restore"
                            ]
                        },
                        {
                            id: 'r2',
                            name: 'User',
                            permissions: [
                                "view_dashboard", "manage_products", "perform_sales", "manage_purchases", "manage_installments", "manage_customers", "manage_maintenance", "manage_treasury", "manage_cash_transfers", "manage_expenses", "manage_suppliers", "manage_returns"
                            ]
                        }
                    ]);
                    if (error) {
                        console.error('Error seeding roles:', error);
                    } else {
                        console.log("Successfully seeded initial roles.");
                    }
                }
            } catch (error) {
                console.error("Failed to check or seed initial data:", error);
            }
        };

        seedInitialData();
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
            // Call a database function (RPC) to handle registration securely.
            // The RPC is responsible for checking for duplicate usernames/emails and hashing the password.
            // The default status for a new user is 'pending', handled by the database function.
            const { data, error } = await supabase.rpc('register_user', {
                p_username: username,
                p_email: email,
                p_password: password
            });
    
            if (error) throw error;
            
            // The RPC is expected to return a JSON object like { success: boolean, message: string }
            if (data && data.success) {
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message || 'Registration failed.' };
            }
    
        } catch (error: any) {
            console.error("Registration RPC failed. Full error object:", error);
            if (error.message?.includes('duplicate key value violates unique constraint')) {
                 return { success: false, message: 'اسم المستخدم أو البريد الإلكتروني مسجل بالفعل.' };
            }
            let message = 'فشل التسجيل. يرجى المحاولة مرة أخرى لاحقاً.';
            if (error && error.message) {
                message = `فشل التسجيل: ${error.message}`;
            }
            return { success: false, message };
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setIsAuthenticated(false);
    };

    // --- Render Logic ---
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