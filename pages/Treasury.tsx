import React, { useState, useMemo } from 'react';
import type { TreasuryTransaction } from '../types';
import PageHeader from '../components/PageHeader';
import { PlusCircleIcon, XIcon, CoinIcon, SalesIcon, MaintenanceIcon, PurchasesIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from '../components/icons';
import Portal from '../components/Portal';


interface TreasuryProps {
  transactions: TreasuryTransaction[];
  // FIX: Updated the type to match the corrected signature in ShopApp.tsx, allowing optional relatedId.
  addTransaction: (transaction: Omit<TreasuryTransaction, 'id' | 'date' | 'balanceAfter'>) => void;
}

const TreasuryFormModal: React.FC<{
    onClose: () => void;
    onAddTransaction: (type: 'deposit' | 'withdrawal', amount: number, description: string) => void;
    currentBalance: number;
}> = ({ onClose, onAddTransaction, currentBalance }) => {
    const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [amount, setAmount] = useState<number>(0);
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0 || !description) {
            alert('الرجاء إدخال مبلغ ووصف صحيحين.');
            return;
        }
        if(type === 'withdrawal' && amount > currentBalance) {
            alert('لا يوجد رصيد كافي في الخزنة لإتمام السحب.');
            return;
        }
        onAddTransaction(type, amount, description);
        onClose();
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fadeInUp" style={{animationDuration: '0.2s'}}>
                <div className="glass-card rounded-lg shadow-2xl p-8 w-full max-w-lg border border-[var(--border-glow)] animate-modal-pop-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-[var(--accent-cyan)]">إضافة حركة يدوية</h3>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white"><XIcon className="w-6 h-6" /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">نوع الحركة</label>
                        <select value={type} onChange={e => setType(e.target.value as any)} className="w-full form-input-futuristic">
                            <option value="deposit">إيداع</option>
                            <option value="withdrawal">سحب</option>
                        </select>
                        </div>
                        <div className="mb-4">
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">المبلغ</label>
                        <input type="number" value={amount} onChange={e => setAmount(Math.max(0, +e.target.value))} className="w-full form-input-futuristic" required />
                        </div>
                        <div className="mb-4">
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الوصف</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full form-input-futuristic" required placeholder="مثال: مصاريف نثرية" />
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-[var(--text-secondary)] bg-black/20 hover:bg-white/10 transition-colors">إلغاء</button>
                            <button type="submit" className="bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-2 px-4 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300">
                                إضافة
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Portal>
    )
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string; glowColor: string; }> = ({ title, value, icon: Icon, color, glowColor }) => (
  <div className="glass-card p-4 rounded-lg flex items-start transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_15px_var(--accent-cyan)]">
    <div className={`p-3 rounded-full me-4 ${color} shadow-[0_0_15px_${glowColor}]`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-[var(--text-secondary)]">{title}</p>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  </div>
);


const Treasury: React.FC<TreasuryProps> = ({ transactions, addTransaction }) => {
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentBalance = transactions.length > 0 ? transactions[transactions.length - 1].balanceAfter : 0;

  const summary = useMemo(() => {
    const salesIncome = transactions.filter(t => t.type === 'deposit' && t.description.match(/بيع|تقسيط|قسط/)).reduce((s, t) => s + t.amount, 0);
    const maintenanceIncome = transactions.filter(t => t.type === 'deposit' && t.description.includes('صيانة')).reduce((s, t) => s + t.amount, 0);
    const purchaseExpenses = transactions.filter(t => t.type === 'withdrawal' && t.description.includes('شراء')).reduce((s, t) => s + t.amount, 0);
    const otherDeposits = transactions.filter(t => t.type === 'deposit' && !t.relatedId).reduce((s, t) => s + t.amount, 0);
    const otherWithdrawals = transactions.filter(t => t.type === 'withdrawal' && !t.relatedId).reduce((s, t) => s + t.amount, 0);
    
    return { salesIncome, maintenanceIncome, purchaseExpenses, otherDeposits, otherWithdrawals };
  }, [transactions]);

  const handleAddTransaction = (type: 'deposit' | 'withdrawal', amount: number, description: string) => {
    addTransaction({ type, amount, description });
  };

  return (
    <div className="p-8 animate-fadeInUp">
      <PageHeader title="الخزنة">
        <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-2 px-4 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300">
            <PlusCircleIcon className="w-5 h-5 me-2" />
            إضافة حركة يدوية
        </button>
      </PageHeader>
      
      <div className="mb-8 p-6 glass-card rounded-lg text-center">
         <p className="text-xl font-bold text-[var(--text-secondary)]">الرصيد الحالي</p>
         <p className="text-5xl font-bold text-[var(--accent-cyan)] drop-shadow-[0_0_12px_var(--accent-cyan)] my-2">
            {currentBalance.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard title="إيرادات المبيعات" value={summary.salesIncome.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} icon={SalesIcon} color="bg-green-500/50" glowColor="rgb(34 197 94)"/>
        <StatCard title="إيرادات الصيانة" value={summary.maintenanceIncome.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} icon={MaintenanceIcon} color="bg-blue-500/50" glowColor="rgb(59 130 246)"/>
        <StatCard title="إيداعات يدوية" value={summary.otherDeposits.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} icon={ArrowUpCircleIcon} color="bg-teal-500/50" glowColor="rgb(20 184 166)"/>
        <StatCard title="تكلفة المشتريات" value={summary.purchaseExpenses.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} icon={PurchasesIcon} color="bg-red-500/50" glowColor="rgb(239 68 68)"/>
        <StatCard title="مسحوبات يدوية" value={summary.otherWithdrawals.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} icon={ArrowDownCircleIcon} color="bg-orange-500/50" glowColor="rgb(249 115 22)"/>
      </div>


      <div className="glass-card p-6 rounded-lg overflow-x-auto">
        <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">سجل الحركات</h3>
        <table className="w-full text-right">
            <thead className="border-b-2 border-[var(--accent-cyan)]">
                <tr>
                    <th className="p-3 text-lg text-[var(--accent-cyan)]">التاريخ</th>
                    <th className="p-3 text-lg text-[var(--accent-cyan)]">الوصف</th>
                    <th className="p-3 text-lg text-[var(--accent-cyan)]">إيداع</th>
                    <th className="p-3 text-lg text-[var(--accent-cyan)]">سحب</th>
                    <th className="p-3 text-lg text-[var(--accent-cyan)]">الرصيد بعد الحركة</th>
                </tr>
            </thead>
            <tbody>
                {transactions.slice().reverse().map(t => (
                    <tr key={t.id} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                        <td className="p-3 text-[var(--text-secondary)]">{new Date(t.date).toLocaleString('ar-EG', {dateStyle: 'short', timeStyle: 'short'})}</td>
                        <td className="p-3 max-w-sm whitespace-normal">{t.description}</td>
                        <td className="p-3 text-green-400 font-semibold">
                        {t.type === 'deposit' ? t.amount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' }) : '-'}
                        </td>
                        <td className="p-3 text-red-400 font-semibold">
                        {t.type === 'withdrawal' ? t.amount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' }) : '-'}
                        </td>
                        <td className="p-3 font-bold">{t.balanceAfter.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
       {isModalOpen && (
        <TreasuryFormModal 
            onClose={() => setIsModalOpen(false)}
            onAddTransaction={handleAddTransaction}
            currentBalance={currentBalance}
        />
      )}
    </div>
  );
};

export default Treasury;