import React, { useState } from 'react';
import { CheckCircleIcon } from '../components/icons';

interface AuthProps {
    onLogin: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
    onRegister: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
}

const LoginComponent: React.FC<{ onLogin: AuthProps['onLogin'], onNavigateToRegister: () => void }> = ({ onLogin, onNavigateToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const { success, message } = await onLogin(username, password);
            if (!success) {
                setError(String(message));
            }
        } catch (err: any) {
            console.error("Error during login process:", err);
            const errorMessage = err?.message || 'An error occurred. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <h2 className="text-3xl font-bold text-center text-[var(--accent-cyan)] drop-shadow-[0_0_8px_var(--accent-cyan)] mb-8">تسجيل الدخول</h2>
            {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4 text-center border border-red-500/30">{error}</p>}
            <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">اسم المستخدم</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full form-input-futuristic" required disabled={isLoading} />
            </div>
            <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">كلمة المرور</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full form-input-futuristic" required disabled={isLoading} />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-3 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'جاري الدخول...' : 'دخول'}
            </button>
            <p className="mt-6 text-center text-[var(--text-secondary)]">
                ليس لديك حساب؟ <button type="button" onClick={onNavigateToRegister} className="font-semibold text-[var(--accent-cyan)] hover:underline">إنشاء حساب جديد</button>
            </p>
        </form>
    );
};

const RegisterComponent: React.FC<{ onRegister: AuthProps['onRegister'], onNavigateToLogin: () => void, onRegistrationComplete: () => void }> = ({ onRegister, onNavigateToLogin, onRegistrationComplete }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
            return;
        }
        try {
            const { success, message } = await onRegister(username, email, password);
            if (success) {
                onRegistrationComplete();
            } else {
                setError(String(message)); // Ensure message is a string
            }
        } catch (err: any) {
            console.error("Error during registration process:", err);
            const errorMessage = err?.message || 'An error occurred. Please try again.';
            setError(errorMessage);
        }
    };
    
    return (
         <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <h2 className="text-3xl font-bold text-center text-[var(--accent-cyan)] drop-shadow-[0_0_8px_var(--accent-cyan)] mb-8">إنشاء حساب جديد</h2>
            {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4 text-center border border-red-500/30">{error}</p>}
            <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">اسم المستخدم</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full form-input-futuristic" required />
            </div>
             <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">البريد الإلكتروني</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full form-input-futuristic" required />
            </div>
            <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">كلمة المرور</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full form-input-futuristic" required />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-3 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300">
                تسجيل
            </button>
            <p className="mt-6 text-center text-[var(--text-secondary)]">
                لديك حساب بالفعل؟ <button type="button" onClick={onNavigateToLogin} className="font-semibold text-[var(--accent-cyan)] hover:underline">تسجيل الدخول</button>
            </p>
        </form>
    );
};

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister }) => {
    const [page, setPage] = useState<'login' | 'register'>('login');
    const [registrationPending, setRegistrationPending] = useState(false);

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4">
            <div className="absolute inset-0 bg-grid-cyan opacity-10"></div>
            <h1 className="text-5xl font-bold text-center text-[var(--accent-cyan)] drop-shadow-[0_0_10px_var(--accent-cyan)] mb-4">M-SHOP OS</h1>
            <p className="text-lg text-[var(--text-secondary)] mb-10">نظام إدارة محلات الهواتف</p>

            <div className="w-full max-w-sm glass-card p-8 rounded-lg shadow-2xl animate-fadeInUp">
                {registrationPending ? (
                     <div className="text-center">
                        <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-400" />
                        <h2 className="text-2xl font-bold text-center text-[var(--accent-cyan)] mb-4">تم التسجيل بنجاح!</h2>
                        <p className="text-[var(--text-secondary)] mb-6">حسابك الآن في انتظار موافقة المدير. سيتم إعلامك عند تفعيله.</p>
                        <button onClick={() => { setPage('login'); setRegistrationPending(false); }} className="font-semibold text-[var(--accent-cyan)] hover:underline">العودة لتسجيل الدخول</button>
                    </div>
                ) : page === 'login' ? (
                    <LoginComponent onLogin={onLogin} onNavigateToRegister={() => setPage('register')} />
                ) : (
                    <RegisterComponent 
                        onRegister={onRegister} 
                        onNavigateToLogin={() => setPage('login')} 
                        onRegistrationComplete={() => setRegistrationPending(true)}
                    />
                )}
            </div>
            <style>{`
                .bg-grid-cyan {
                    background-image:
                        linear-gradient(var(--accent-cyan) 1px, transparent 1px),
                        linear-gradient(to right, var(--accent-cyan) 1px, transparent 1px);
                    background-size: 2rem 2rem;
                }
            `}</style>
        </div>
    );
};

export default Auth;