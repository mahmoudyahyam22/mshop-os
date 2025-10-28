import React, { useMemo, useState, useEffect } from 'react';
import type { User, Role } from '../types';
import { supabase } from '../supabaseClient';
import { UsersIcon, CheckCircleIcon, TrashIcon, LogoutIcon } from '../components/icons';

interface SuperAdminDashboardProps {
    onLogout: () => void;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="glass-card p-6 rounded-lg flex items-center transition-all duration-300 transform hover:-translate-y-2">
        <div className="p-3 rounded-full me-4 bg-cyan-500/30">
            <Icon className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
            <p className="text-lg text-[var(--text-secondary)]">{title}</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
        </div>
    </div>
);

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout }) => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        if (!supabase) return;
        setIsLoading(true);
        const [usersRes, rolesRes] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('roles').select('*')
        ]);

        if (usersRes.error) {
            console.error("Failed to fetch users:", usersRes.error);
            alert('فشل في جلب قائمة المستخدمين.');
        } else {
            const mappedUsers = usersRes.data.map(u => ({
                username: u.username,
                email: u.email,
                passwordHash: u.password_hash || u.passwordHash,
                roleId: u.role_id || u.roleId,
                status: u.status,
            }));
            setAllUsers(mappedUsers);
        }
        
        if (rolesRes.error) {
            console.error("Failed to fetch roles:", rolesRes.error);
        } else {
            setRoles(rolesRes.data as Role[]);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const systemUsers = useMemo(() => allUsers.filter(u => u.username !== 'superadmin'), [allUsers]);

    const stats = useMemo(() => ({
        total: systemUsers.length,
        approved: systemUsers.filter(u => u.status === 'approved').length,
        pending: systemUsers.filter(u => u.status === 'pending').length,
    }), [systemUsers]);
    
    const approveUser = async (username: string) => {
        if(window.confirm(`هل أنت متأكد من تفعيل حساب المستخدم ${username}؟`)) {
            if (!supabase) return;
            const { error } = await supabase
                .from('users')
                .update({ status: 'approved' })
                .eq('username', username);

            if (error) {
                 alert(`فشل تفعيل المستخدم: ${error.message}`);
            } else {
                alert('تم تفعيل المستخدم بنجاح');
                fetchData(); // Refresh the list
            }
        }
    };
    
    const deleteUser = async (username: string) => {
         if(window.confirm(`تحذير: سيتم حذف المستخدم ${username} وجميع بياناته بشكل نهائي. هل أنت متأكد؟`)) {
             if (!supabase) return;
             const { error } = await supabase
                .from('users')
                .delete()
                .eq('username', username);
            
             if (error) {
                 alert(`فشل حذف المستخدم: ${error.message}`);
            } else {
                alert('تم حذف المستخدم بنجاح');
                fetchData(); // Refresh the list
            }
        }
    };

    const updateUserRole = async (username: string, roleId: string) => {
        if (!supabase) return;
        const { error } = await supabase
            .from('users')
            .update({ role_id: roleId })
            .eq('username', username);

        if (error) {
            alert(`فشل تحديث الدور: ${error.message}`);
        } else {
            alert('تم تحديث دور المستخدم بنجاح.');
            fetchData(); // Refresh data
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--bg-dark-primary)] to-[var(--bg-dark-secondary)] text-[var(--text-primary)]">
            <header className="p-4 flex justify-between items-center glass-card">
                 <h1 className="text-2xl font-bold text-[var(--accent-cyan)] drop-shadow-[0_0_5px_var(--accent-cyan)]">لوحة تحكم مدير النظام</h1>
                 <button onClick={onLogout} title="تسجيل الخروج" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors">
                    <LogoutIcon className="w-6 h-6"/>
                    <span className="hidden sm:inline">تسجيل الخروج</span>
                </button>
            </header>

            <main className="p-8 animate-fadeInUp">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <StatCard title="إجمالي المشتركين" value={stats.total} icon={UsersIcon} />
                    <StatCard title="الحسابات المفعلة" value={stats.approved} icon={CheckCircleIcon} />
                    <StatCard title="حسابات قيد المراجعة" value={stats.pending} icon={UsersIcon} />
                </div>

                 <div className="glass-card p-6 rounded-lg overflow-x-auto">
                    <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">إدارة المشتركين</h3>
                     {isLoading ? <p>جاري تحميل المستخدمين...</p> : (
                        <table className="w-full text-right">
                            <thead className="border-b-2 border-[var(--accent-cyan)]">
                                <tr>
                                    <th className="p-3 text-[var(--accent-cyan)]">اسم المستخدم</th>
                                    <th className="p-3 text-[var(--accent-cyan)]">البريد الإلكتروني</th>
                                    <th className="p-3 text-[var(--accent-cyan)]">الدور</th>
                                    <th className="p-3 text-[var(--accent-cyan)]">الحالة</th>
                                    <th className="p-3 text-[var(--accent-cyan)]">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {systemUsers.map(user => (
                                    <tr key={user.username} className="border-b border-white/10 hover:bg-white/5">
                                        <td className="p-3 font-medium">{user.username}</td>
                                        <td className="p-3 text-[var(--text-secondary)]">{user.email}</td>
                                        <td className="p-3">
                                            <select 
                                                value={user.roleId} 
                                                onChange={e => updateUserRole(user.username, e.target.value)} 
                                                className="form-input-futuristic !p-2 !border-none bg-black/20"
                                            >
                                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            {user.status === 'approved' 
                                                ? <span className="bg-green-500/20 text-green-300 text-xs font-medium px-2.5 py-0.5 rounded-full">مفعل</span> 
                                                : <span className="bg-yellow-500/20 text-yellow-300 text-xs font-medium px-2.5 py-0.5 rounded-full">قيد المراجعة</span>
                                            }
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-4">
                                                {user.status === 'pending' && (
                                                    <button onClick={() => approveUser(user.username)} title="تفعيل الحساب" className="text-green-400 hover:text-green-500 transition-colors">
                                                        <CheckCircleIcon className="w-6 h-6"/>
                                                    </button>
                                                )}
                                                <button onClick={() => deleteUser(user.username)} title="حذف الحساب" className="text-red-400 hover:text-red-500 transition-colors">
                                                    <TrashIcon className="w-6 h-6"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                 {systemUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center p-8 text-[var(--text-secondary)]">
                                            لا يوجد مشتركين حتى الآن.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                     )}
                </div>
            </main>
        </div>
    );
};

export default SuperAdminDashboard;