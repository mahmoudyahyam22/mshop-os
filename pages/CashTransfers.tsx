import React, { useState, useMemo, useEffect } from 'react';
import type { CashTransferAccount, CashTransferTransaction, AppSettings, TreasuryTransaction } from '../types';
import PageHeader from '../components/PageHeader';
import { PlusCircleIcon, EditIcon, TrashIcon, XIcon, CoinIcon, TransferIcon } from '../components/icons';
import Portal from '../components/Portal';

// Helper functions for date checking
const isToday = (someDate: string) => {
    const today = new Date();
    const date = new Date(someDate);
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

const isThisMonth = (someDate: string) => {
    const today = new Date();
    const date = new Date(someDate);
    return date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

// --- MODAL COMPONENTS ---
interface TransactionModalProps {
    accounts: CashTransferAccount[];
    onClose: () => void;
    onSave: (transaction: Omit<CashTransferTransaction, 'id'|'date'>) => void;
}
const TransactionModal: React.FC<TransactionModalProps> = ({ accounts, onClose, onSave }) => {
    const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
    const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [amount, setAmount] = useState(0);
    const [commission, setCommission] = useState(0);
    const [customerPhone, setCustomerPhone] = useState('');

    useEffect(() => {
        if (amount > 0) {
            setCommission(Math.round(amount * 0.01));
        } else {
            setCommission(0);
        }
    }, [amount]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountId || amount <= 0) {
            alert('يرجى تحديد حساب وإدخال مبلغ صحيح.');
            return;
        }
        onSave({ accountId, type, amount, commission, customerPhone });
        onClose();
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] animate-fadeInUp" style={{animationDuration: '0.2s'}}>
                <div className="glass-card rounded-lg shadow-2xl p-8 w-full max-w-lg border border-[var(--border-glow)] animate-modal-pop-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-[var(--accent-cyan)]">إضافة عملية تحويل جديدة</h3>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white"><XIcon className="w-6 h-6" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">من حساب</label>
                            <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full form-input-futuristic" required>
                                <option disabled value="">-- اختر حساب --</option>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.number})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">نوع العملية</label>
                            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full form-input-futuristic">
                                <option value="deposit">إيداع (أستلم كاش وأحوّل)</option>
                                <option value="withdrawal">سحب (أحوّل وأعطي كاش)</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">المبلغ</label>
                                <input type="number" value={amount} onChange={e => setAmount(+e.target.value)} className="w-full form-input-futuristic" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">العمولة (1% تلقائي)</label>
                                <input type="number" value={commission} onChange={e => setCommission(+e.target.value)} className="w-full form-input-futuristic" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">هاتف العميل (اختياري)</label>
                            <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full form-input-futuristic" />
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-[var(--text-secondary)] bg-black/20 hover:bg-white/10 transition-colors">إلغاء</button>
                            <button type="submit" className="bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-2 px-4 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300">حفظ العملية</button>
                        </div>
                    </form>
                </div>
            </div>
        </Portal>
    );
};

interface AccountsModalProps {
    accounts: CashTransferAccount[];
    onClose: () => void;
    onAdd: (account: Omit<CashTransferAccount, 'id'|'balance'>) => void;
    onUpdate: (account: CashTransferAccount) => void;
    onDelete: (accountId: string) => void;
}
const AccountsModal: React.FC<AccountsModalProps> = ({ accounts, onClose, onAdd, onUpdate, onDelete }) => {
    const [newAccount, setNewAccount] = useState({ name: '', number: '', provider: 'Vodafone', dailyLimit: 30000, monthlyLimit: 100000 });

    const handleAddAccount = () => {
        if (!newAccount.name || !newAccount.number) {
            alert('الاسم ورقم الهاتف حقول مطلوبة.');
            return;
        }
        onAdd(newAccount);
        setNewAccount({ name: '', number: '', provider: 'Vodafone', dailyLimit: 30000, monthlyLimit: 100000 });
    };

    return (
         <Portal>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] animate-fadeInUp" style={{animationDuration: '0.2s'}}>
                <div className="glass-card rounded-lg shadow-2xl p-8 w-full max-w-3xl border border-[var(--border-glow)] animate-modal-pop-in">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-[var(--accent-cyan)]">إدارة حسابات التحويل</h3>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white"><XIcon className="w-6 h-6" /></button>
                    </div>
                    {/* Add new account form */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-4 border border-[var(--border-glow)] rounded-lg mb-6">
                         <div className="md:col-span-2"><label className="text-xs text-[var(--text-secondary)]">الاسم</label><input type="text" placeholder="فودافون كاش 1" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} className="w-full form-input-futuristic" /></div>
                         <div className="md:col-span-2"><label className="text-xs text-[var(--text-secondary)]">الرقم</label><input type="text" placeholder="010xxxx" value={newAccount.number} onChange={e => setNewAccount({...newAccount, number: e.target.value})} className="w-full form-input-futuristic" /></div>
                         <div><label className="text-xs text-[var(--text-secondary)]">الحد اليومي</label><input type="number" value={newAccount.dailyLimit} onChange={e => setNewAccount({...newAccount, dailyLimit: +e.target.value})} className="w-full form-input-futuristic" /></div>
                         <button onClick={handleAddAccount} className="bg-green-500/80 text-white font-bold h-10 rounded-md shadow-lg hover:bg-green-500 transition-all">إضافة</button>
                    </div>
                    {/* List of existing accounts */}
                    <div className="max-h-80 overflow-y-auto">
                        {accounts.map(acc => (
                            <div key={acc.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg mb-2">
                                <div>
                                    <p className="font-bold">{acc.name} <span className="text-sm text-[var(--text-secondary)]">({acc.number})</span></p>
                                    <p className="text-xs text-cyan-300">الرصيد: {acc.balance.toLocaleString('ar-EG')} ج.م</p>
                                </div>
                                <button onClick={() => window.confirm('هل أنت متأكد؟') && onDelete(acc.id)} className="text-red-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Portal>
    );
};

const ToggleSwitch: React.FC<{checked: boolean, onChange: (checked: boolean) => void, label: string}> = ({ checked, onChange, label }) => (
    <div className="flex items-center gap-3">
        <label className="text-sm text-[var(--text-secondary)]">{label}</label>
        <button
            onClick={() => onChange(!checked)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none ${checked ? 'bg-[var(--accent-cyan)]' : 'bg-gray-600'}`}
        >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    </div>
);


// --- MAIN PAGE COMPONENT ---
interface CashTransfersProps {
    accounts: CashTransferAccount[];
    transactions: CashTransferTransaction[];
    cashTransferTreasury: TreasuryTransaction[];
    appSettings: AppSettings;
    updateAppSettings: (settings: AppSettings) => void;
    addAccount: (account: Omit<CashTransferAccount, 'id'|'balance'>) => void;
    updateAccount: (account: CashTransferAccount) => void;
    deleteAccount: (accountId: string) => void;
    addTransaction: (transaction: Omit<CashTransferTransaction, 'id'|'date'>) => void;
}

const CashTransfers: React.FC<CashTransfersProps> = ({ accounts, transactions, cashTransferTreasury, appSettings, updateAppSettings, addAccount, updateAccount, deleteAccount, addTransaction }) => {
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('operations');

    const stats = useMemo(() => {
        const todayProfit = transactions.filter(t => isToday(t.date)).reduce((sum, t) => sum + t.commission, 0);
        const monthProfit = transactions.filter(t => isThisMonth(t.date)).reduce((sum, t) => sum + t.commission, 0);
        const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        const separateTreasuryBalance = cashTransferTreasury.length > 0 ? cashTransferTreasury[cashTransferTreasury.length - 1].balanceAfter : 0;
        return { todayProfit, monthProfit, totalBalance, separateTreasuryBalance };
    }, [accounts, transactions, cashTransferTreasury]);

    const accountsWithLimits = useMemo(() => {
        return accounts.map(account => {
            const accountTransactions = transactions.filter(t => t.accountId === account.id);
            const dailyTotal = accountTransactions.filter(t => isToday(t.date)).reduce((sum, t) => sum + t.amount, 0);
            const monthlyTotal = accountTransactions.filter(t => isThisMonth(t.date)).reduce((sum, t) => sum + t.amount, 0);
            return { ...account, dailyTotal, monthlyTotal };
        });
    }, [accounts, transactions]);

    const getLimitColor = (percentage: number) => {
        if (percentage > 90) return 'bg-red-500';
        if (percentage > 75) return 'bg-yellow-500';
        return 'bg-cyan-400';
    };

    return (
        <div className="p-8 animate-fadeInUp">
            <PageHeader title="تحويلات الكاش">
                <ToggleSwitch 
                    label="ربط بالخزنة الرئيسية"
                    checked={appSettings.linkCashTransfersToMainTreasury}
                    onChange={(checked) => updateAppSettings({ ...appSettings, linkCashTransfersToMainTreasury: checked })}
                />
                <button onClick={() => setIsAccountsModalOpen(true)} className="flex items-center bg-gray-500/50 text-white font-bold py-2 px-4 rounded-md shadow-lg hover:bg-gray-500/80 transition-colors duration-300">
                    إدارة الحسابات
                </button>
                <button onClick={() => setIsTransactionModalOpen(true)} className="flex items-center bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-2 px-4 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300">
                    <PlusCircleIcon className="w-5 h-5 me-2" />
                    عملية جديدة
                </button>
            </PageHeader>
            
            <div className={`grid grid-cols-1 md:grid-cols-2 ${appSettings.linkCashTransfersToMainTreasury ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6 mb-8`}>
                <div className="glass-card p-4 rounded-lg"><p className="text-[var(--text-secondary)]">إجمالي الأرصدة</p><p className="text-2xl font-bold text-cyan-300">{stats.totalBalance.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</p></div>
                {!appSettings.linkCashTransfersToMainTreasury && (
                    <div className="glass-card p-4 rounded-lg"><p className="text-[var(--text-secondary)]">رصيد خزنة التحويلات</p><p className="text-2xl font-bold text-purple-400">{stats.separateTreasuryBalance.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</p></div>
                )}
                <div className="glass-card p-4 rounded-lg"><p className="text-[var(--text-secondary)]">أرباح اليوم</p><p className="text-2xl font-bold text-green-400">{stats.todayProfit.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</p></div>
                <div className="glass-card p-4 rounded-lg"><p className="text-[var(--text-secondary)]">أرباح الشهر</p><p className="text-2xl font-bold text-green-400">{stats.monthProfit.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 glass-card p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">أرصدة وحدود الحسابات</h3>
                    <div className="space-y-6 max-h-[500px] overflow-y-auto">
                        {accountsWithLimits.map(acc => {
                            const dailyPercent = acc.dailyLimit > 0 ? (acc.dailyTotal / acc.dailyLimit) * 100 : 0;
                            const monthlyPercent = acc.monthlyLimit > 0 ? (acc.monthlyTotal / acc.monthlyLimit) * 100 : 0;
                            return (
                                <div key={acc.id} className="bg-black/20 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-bold">{acc.name} <span className="text-sm text-[var(--text-secondary)]">({acc.number})</span></p>
                                        <p className="font-bold text-cyan-300">{acc.balance.toLocaleString('ar-EG')} ج.م</p>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1"><span>الحد اليومي</span><span>{acc.dailyTotal.toLocaleString('ar-EG')} / {acc.dailyLimit.toLocaleString('ar-EG')}</span></div>
                                        <div className="w-full bg-black/30 rounded-full h-2.5"><div className={`${getLimitColor(dailyPercent)} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(dailyPercent, 100)}%` }}></div></div>
                                    </div>
                                     <div className="mt-2">
                                        <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1"><span>الحد الشهري</span><span>{acc.monthlyTotal.toLocaleString('ar-EG')} / {acc.monthlyLimit.toLocaleString('ar-EG')}</span></div>
                                        <div className="w-full bg-black/30 rounded-full h-2.5"><div className={`${getLimitColor(monthlyPercent)} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(monthlyPercent, 100)}%` }}></div></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="lg:col-span-3 glass-card p-6 rounded-lg">
                    <div className="flex border-b border-[var(--border-glow)] mb-4">
                        <button onClick={() => setActiveTab('operations')} className={`py-2 px-4 transition-colors ${activeTab==='operations' ? 'text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]' : 'text-[var(--text-secondary)]'}`}>آخر العمليات</button>
                        {!appSettings.linkCashTransfersToMainTreasury && 
                            <button onClick={() => setActiveTab('treasury')} className={`py-2 px-4 transition-colors ${activeTab==='treasury' ? 'text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]' : 'text-[var(--text-secondary)]'}`}>سجل الخزنة</button>
                        }
                    </div>

                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        {activeTab === 'operations' ? (
                            <table className="w-full text-right">
                                <thead className="border-b-2 border-[var(--accent-cyan)] sticky top-0 bg-[var(--bg-glass)]">
                                    <tr>
                                        <th className="p-3 text-[var(--accent-cyan)]">التاريخ</th>
                                        <th className="p-3 text-[var(--accent-cyan)]">الحساب</th>
                                        <th className="p-3 text-[var(--accent-cyan)]">النوع</th>
                                        <th className="p-3 text-[var(--accent-cyan)]">المبلغ</th>
                                        <th className="p-3 text-[var(--accent-cyan)]">الربح</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(t => {
                                        const account = accounts.find(a => a.id === t.accountId);
                                        return (
                                            <tr key={t.id} className="border-b border-white/10 hover:bg-white/5">
                                                <td className="p-2 text-sm text-[var(--text-secondary)]">{new Date(t.date).toLocaleString('ar-EG', {dateStyle: 'short', timeStyle: 'short'})}</td>
                                                <td className="p-2">{account?.name || 'محذوف'}</td>
                                                <td className={`p-2 font-semibold ${t.type === 'deposit' ? 'text-red-400' : 'text-green-400'}`}>{t.type === 'deposit' ? 'إيداع' : 'سحب'}</td>
                                                <td className="p-2">{t.amount.toLocaleString('ar-EG')}</td>
                                                <td className="p-2 text-green-400 font-bold">{t.commission.toLocaleString('ar-EG')}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-right">
                                <thead className="border-b-2 border-[var(--accent-cyan)] sticky top-0 bg-[var(--bg-glass)]">
                                    <tr>
                                        <th className="p-3 text-[var(--accent-cyan)]">التاريخ</th>
                                        <th className="p-3 text-[var(--accent-cyan)]">الوصف</th>
                                        <th className="p-3 text-[var(--accent-cyan)]">إيداع</th>
                                        <th className="p-3 text-[var(--accent-cyan)]">سحب</th>
                                        <th className="p-3 text-[var(--accent-cyan)]">الرصيد</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashTransferTreasury.slice().reverse().map(t => (
                                        <tr key={t.id} className="border-b border-white/10 hover:bg-white/5">
                                            <td className="p-2 text-sm text-[var(--text-secondary)]">{new Date(t.date).toLocaleString('ar-EG', {dateStyle: 'short', timeStyle: 'short'})}</td>
                                            <td className="p-2 text-sm">{t.description}</td>
                                            <td className="p-2 text-green-400">{t.type === 'deposit' ? t.amount.toLocaleString('ar-EG') : '-'}</td>
                                            <td className="p-2 text-red-400">{t.type === 'withdrawal' ? t.amount.toLocaleString('ar-EG') : '-'}</td>
                                            <td className="p-2 font-bold">{t.balanceAfter.toLocaleString('ar-EG')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {isTransactionModalOpen && <TransactionModal accounts={accounts} onClose={() => setIsTransactionModalOpen(false)} onSave={addTransaction} />}
            {isAccountsModalOpen && <AccountsModal accounts={accounts} onClose={() => setIsAccountsModalOpen(false)} onAdd={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} />}
        </div>
    );
};

export default CashTransfers;