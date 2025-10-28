import React, { useState, useRef } from 'react';
import type { User, Role, Permission } from '../types';
import { ALL_PERMISSIONS } from '../types'; // Import from central location
import PageHeader from '../components/PageHeader';
import { TrashIcon, CheckCircleIcon, EditIcon, PlusCircleIcon, XIcon, ShieldCheckIcon, DatabaseIcon, UploadIcon, DownloadIcon } from '../components/icons';
import Portal from '../components/Portal';


const RoleModal: React.FC<{
    role: Role | Omit<Role, 'id'>,
    onClose: () => void,
    onSave: (role: Role | Omit<Role, 'id'>) => void
}> = ({ role, onClose, onSave }) => {
    const [currentRole, setCurrentRole] = useState(role);

    const handlePermissionChange = (permission: Permission, checked: boolean) => {
        const permissions = currentRole.permissions;
        if(checked) {
            setCurrentRole({...currentRole, permissions: [...permissions, permission]});
        } else {
            setCurrentRole({...currentRole, permissions: permissions.filter(p => p !== permission)});
        }
    };

    const handleSave = () => {
        if(!currentRole.name) { alert('يجب إدخال اسم للدور.'); return; }
        onSave(currentRole);
        onClose();
    };

    return (
         <Portal>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] animate-fadeInUp" style={{animationDuration: '0.2s'}}>
                <div className="glass-card rounded-lg shadow-2xl p-8 w-full max-w-3xl border border-[var(--border-glow)] animate-modal-pop-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-[var(--accent-cyan)]">{'id' in role ? 'تعديل دور' : 'إضافة دور جديد'}</h3>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white"><XIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">اسم الدور</label>
                        <input type="text" value={currentRole.name} onChange={e => setCurrentRole({...currentRole, name: e.target.value})} className="w-full form-input-futuristic" required />
                    </div>
                    <h4 className="font-bold text-[var(--text-primary)] mb-3">الصلاحيات</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto p-4 bg-black/20 rounded-lg">
                        {ALL_PERMISSIONS.map(p => (
                            <label key={p.id} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentRole.permissions.includes(p.id)}
                                    onChange={(e) => handlePermissionChange(p.id, e.target.checked)}
                                    className="w-4 h-4 accent-[var(--accent-cyan)]"
                                />
                                <span className={`text-sm text-[var(--text-secondary)]`}>{p.label}</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-[var(--text-secondary)] bg-black/20 hover:bg-white/10 transition-colors">إلغاء</button>
                        <button onClick={handleSave} className="bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-2 px-4 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300">حفظ</button>
                    </div>
                </div>
            </div>
        </Portal>
    )
};


const BackupRestoreTab: React.FC<{
    onBackup: () => void;
    onRestore: (file: File) => void;
}> = ({ onBackup, onRestore }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (window.confirm(`تحذير: هذه العملية ستقوم بمسح جميع البيانات الحالية واستبدالها بالبيانات من الملف الذي اخترته. هل أنت متأكد من المتابعة؟`)) {
                onRestore(file);
            }
            // Reset file input to allow uploading the same file again
            event.target.value = '';
        }
    };

    return (
        <div className="glass-card p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">النسخ الاحتياطي والاستعادة</h3>
            <div className="space-y-6">
                <div className="bg-black/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg text-green-400 flex items-center gap-2"><DownloadIcon/> النسخ الاحتياطي</h4>
                    <p className="text-[var(--text-secondary)] my-2">قم بتنزيل نسخة احتياطية من جميع بيانات التطبيق (منتجات، عملاء، فواتير، إلخ) في ملف JSON واحد. احتفظ بهذا الملف في مكان آمن.</p>
                    <button onClick={onBackup} className="bg-green-500/80 text-white font-bold py-2 px-4 rounded-md shadow-lg hover:bg-green-500 transition-all">
                        تنزيل نسخة احتياطية الآن
                    </button>
                </div>
                <div className="bg-black/20 p-4 rounded-lg border border-red-500/30">
                    <h4 className="font-semibold text-lg text-red-400 flex items-center gap-2"><UploadIcon /> استعادة البيانات</h4>
                    <p className="text-[var(--text-secondary)] my-2">تحذير: استعادة البيانات من ملف ستقوم بمسح جميع البيانات الحالية. لا يمكن التراجع عن هذه العملية.</p>
                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="bg-red-500/80 text-white font-bold py-2 px-4 rounded-md shadow-lg hover:bg-red-500 transition-all">
                        اختيار ملف للاستعادة
                    </button>
                </div>
            </div>
        </div>
    );
};


interface AdminProps {
  allUsers: User[];
  currentUser: User;
  roles: Role[];
  deleteUser: (username: string) => void;
  approveUser: (username: string) => void;
  updateUserRole: (username: string, roleId: string) => void;
  updateRole: (role: Role) => void;
  addRole: (role: Omit<Role, 'id'>) => void;
  deleteRole: (roleId: string) => void;
  handleBackup: () => void;
  handleRestore: (file: File) => void;
}

const Admin: React.FC<AdminProps> = ({ allUsers, currentUser, roles, deleteUser, approveUser, updateUserRole, updateRole, addRole, deleteRole, handleBackup, handleRestore }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'backup'>('users');
    const [roleModal, setRoleModal] = useState<{isOpen: boolean, role: Role | Omit<Role, 'id'> | null}>({isOpen: false, role: null});

    const handleSaveRole = (role: Role | Omit<Role, 'id'>) => {
        if('id' in role) {
            updateRole(role);
        } else {
            addRole(role);
        }
    };

    return (
        <div className="p-8 animate-fadeInUp">
            <PageHeader title="لوحة تحكم المدير" />

            <div className="mb-6 border-b border-[var(--border-glow)]">
                <nav className="-mb-px flex space-x-6 rtl:space-x-reverse">
                    <button onClick={() => setActiveTab('users')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-all ${activeTab === 'users' ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'border-transparent text-[var(--text-secondary)]'}`}>إدارة المستخدمين</button>
                    <button onClick={() => setActiveTab('roles')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-all ${activeTab === 'roles' ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'border-transparent text-[var(--text-secondary)]'}`}>إدارة الأدوار</button>
                    <button onClick={() => setActiveTab('backup')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-all ${activeTab === 'backup' ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'border-transparent text-[var(--text-secondary)]'}`}>النسخ الاحتياطي</button>
                </nav>
            </div>
            
            {activeTab === 'users' && (
                <div className="glass-card p-6 rounded-lg overflow-x-auto">
                    <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">المستخدمون</h3>
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
                            {allUsers.map(user => (
                                <tr key={user.username} className="border-b border-white/10 hover:bg-white/5">
                                    <td className="p-3 font-medium">{user.username}</td>
                                    <td className="p-3 text-[var(--text-secondary)]">{user.email}</td>
                                    <td className="p-3">
                                        <select 
                                            value={user.roleId} 
                                            onChange={e => updateUserRole(user.username, e.target.value)} 
                                            className="form-input-futuristic !p-1 !border-none"
                                            disabled={user.username === currentUser.username}
                                        >
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-3">{user.status === 'approved' ? <span className="text-green-400">مفعل</span> : <span className="text-yellow-400">قيد المراجعة</span>}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            {user.status === 'pending' && <button onClick={() => approveUser(user.username)} className="text-green-400 hover:text-green-500"><CheckCircleIcon/></button>}
                                            {user.username !== currentUser.username && <button onClick={() => window.confirm('هل أنت متأكد؟') && deleteUser(user.username)} className="text-red-400 hover:text-red-500"><TrashIcon/></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

             {activeTab === 'roles' && (
                <div className="glass-card p-6 rounded-lg">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">الأدوار والصلاحيات</h3>
                        <button onClick={() => setRoleModal({isOpen: true, role: {name: '', permissions: []}})} className="flex items-center bg-green-500/80 text-white font-bold py-2 px-3 rounded-md shadow-lg hover:bg-green-500 transition-all">
                           <PlusCircleIcon className="w-5 h-5 me-2"/> إضافة دور
                        </button>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-right">
                             <thead className="border-b-2 border-[var(--accent-cyan)]">
                                <tr>
                                    <th className="p-3 text-[var(--accent-cyan)]">اسم الدور</th>
                                    <th className="p-3 text-[var(--accent-cyan)]">إجراءات</th>
                                </tr>
                             </thead>
                             <tbody>
                                {roles.map(role => (
                                    <tr key={role.id} className="border-b border-white/10 hover:bg-white/5">
                                        <td className="p-3 font-medium">{role.name}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setRoleModal({isOpen: true, role: role})} className="text-blue-400 hover:text-blue-500"><EditIcon/></button>
                                                {role.id !== 'r1' && role.id !== 'r2' && (
                                                    <button 
                                                        onClick={() => window.confirm('هل أنت متأكد؟') && deleteRole(role.id)} 
                                                        className="text-red-400 hover:text-red-500"
                                                        title="حذف الدور"
                                                    >
                                                        <TrashIcon/>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                     </div>
                </div>
            )}
            
            {activeTab === 'backup' && (
                <BackupRestoreTab onBackup={handleBackup} onRestore={handleRestore} />
            )}

            {roleModal.isOpen && roleModal.role && (
                <RoleModal role={roleModal.role} onClose={() => setRoleModal({isOpen: false, role: null})} onSave={handleSaveRole}/>
            )}
        </div>
    );
};

export default Admin;