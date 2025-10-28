import React, { useState, useMemo, useEffect } from 'react';
import type { InstallmentPlan, Customer, Installment } from '../types';
import PageHeader from '../components/PageHeader';
import { XIcon, CoinIcon } from '../components/icons';
import Portal from '../components/Portal';

interface InstallmentsProps {
  installmentPlans: InstallmentPlan[];
  customers: Customer[];
  addPayment: (payment: { installmentPlanId: string; installmentId: string; amount: number; }) => void;
}

const InstallmentDetailsModal: React.FC<{
    plan: InstallmentPlan,
    customer: Customer,
    onClose: () => void;
    onAddPayment: (paymentData: { installmentPlanId: string; installmentId: string; amount: number; }) => void;
}> = ({ plan, customer, onClose, onAddPayment }) => {

    const [paymentModal, setPaymentModal] = useState<{isOpen: boolean, installment: Installment | null}>({isOpen: false, installment: null});

    const handlePayment = () => {
        if (paymentModal.installment) {
            onAddPayment({
                installmentPlanId: plan.id, 
                installmentId: paymentModal.installment.id, 
                amount: paymentModal.installment.amount
            });
            setPaymentModal({isOpen: false, installment: null});
        }
    };
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    return (
        <Portal>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] animate-fadeInUp" style={{animationDuration: '0.2s'}}>
                <div className="glass-card rounded-lg shadow-2xl p-8 w-full max-w-4xl border border-[var(--border-glow)] animate-modal-pop-in">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-[var(--accent-cyan)]">تفاصيل أقساط - {customer.name}</h3>
                            <p className="text-[var(--text-secondary)]">فاتورة رقم #{plan.saleId.substring(1)}</p>
                        </div>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white"><XIcon className="w-6 h-6" /></button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                        <div className="glass-card p-3 rounded-md"><p className="text-sm text-[var(--text-secondary)]">المبلغ الإجمالي</p><p className="font-bold">{plan.totalAmount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</p></div>
                        <div className="glass-card p-3 rounded-md"><p className="text-sm text-[var(--text-secondary)]">المقدم</p><p className="font-bold">{plan.downPayment.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</p></div>
                        <div className="glass-card p-3 rounded-md"><p className="text-sm text-[var(--text-secondary)]">المتبقي</p><p className="font-bold text-yellow-400">{plan.remainingAmount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</p></div>
                        <div className="glass-card p-3 rounded-md"><p className="text-sm text-[var(--text-secondary)]">القسط الشهري</p><p className="font-bold">{plan.monthlyInstallment.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</p></div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-right">
                            <thead className="border-b border-[var(--border-glow)] sticky top-0 bg-[var(--bg-dark-primary)]">
                                <tr>
                                    <th className="p-3 font-semibold text-[var(--accent-cyan)]">تاريخ الاستحقاق</th>
                                    <th className="p-3 font-semibold text-[var(--accent-cyan)]">المبلغ</th>
                                    <th className="p-3 font-semibold text-[var(--accent-cyan)]">الحالة</th>
                                    <th className="p-3 font-semibold text-[var(--accent-cyan)]">تاريخ السداد</th>
                                    <th className="p-3 font-semibold text-[var(--accent-cyan)]">إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plan.installments.map(installment => {
                                    const dueDate = new Date(installment.dueDate);
                                    const isOverdue = installment.status === 'pending' && dueDate < today;
                                    return (
                                    <tr key={installment.id} className={`border-b border-white/10 ${isOverdue ? 'bg-red-500/10' : ''}`}>
                                        <td className="p-3">{dueDate.toLocaleDateString('ar-EG')}</td>
                                        <td className="p-3">{installment.amount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                                        <td className="p-3">
                                            {installment.status === 'paid' ? <span className="text-green-400 font-bold">مدفوع</span> : (isOverdue ? <span className="text-red-400 font-bold">متأخر</span> : <span className="text-yellow-400">قادم</span>)}
                                        </td>
                                        <td className="p-3">{installment.paymentDate ? new Date(installment.paymentDate).toLocaleDateString('ar-EG') : '-'}</td>
                                        <td className="p-3">
                                            {installment.status === 'pending' && <button onClick={() => setPaymentModal({isOpen: true, installment: installment})} className="flex items-center text-sm bg-green-500/80 text-white font-bold py-1 px-3 rounded-md shadow-md hover:bg-green-500 hover:shadow-[0_0_10px_rgb(34,197,94)] transition-all">
                                                <CoinIcon className="w-4 h-4 me-1"/>
                                                تحصيل
                                            </button>}
                                        </td>
                                    </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                {paymentModal.isOpen && paymentModal.installment && (
                    <Portal>
                        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[70]">
                            <div className="glass-card p-6 rounded-lg w-full max-w-md text-center animate-modal-pop-in">
                                <h3 className="text-xl font-bold mb-2">تأكيد تحصيل قسط</h3>
                                <p className="mb-6 text-[var(--text-secondary)]">هل أنت متأكد من تحصيل مبلغ <span className="font-bold text-[var(--accent-cyan)]">{paymentModal.installment.amount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</span> من العميل <span className="font-bold text-[var(--accent-cyan)]">{customer.name}</span>؟</p>
                                <div className="flex justify-center gap-4">
                                    <button onClick={() => setPaymentModal({isOpen: false, installment: null})} className="py-2 px-6 rounded-md text-[var(--text-secondary)] bg-black/20 hover:bg-white/10 transition-colors">إلغاء</button>
                                    <button onClick={handlePayment} className="py-2 px-6 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold rounded-md shadow-lg hover:shadow-[0_0_15px_var(--accent-cyan)] transition-shadow">تأكيد</button>
                                </div>
                            </div>
                        </div>
                    </Portal>
                )}
            </div>
        </Portal>
    )
}

const Installments: React.FC<InstallmentsProps> = ({ installmentPlans, customers, addPayment }) => {
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlan | null>(null);
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'completed'>('ongoing');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (selectedPlan) {
      const updatedPlan = installmentPlans.find(p => p.id === selectedPlan.id);
      if (updatedPlan) {
        setSelectedPlan(updatedPlan);
      } else {
        setSelectedPlan(null);
      }
    }
  }, [installmentPlans, selectedPlan]);

  const plansWithDetails = useMemo(() => {
    return installmentPlans.map(plan => {
      const customer = customers.find(c => c.id === plan.customerId);
      const paidInstallmentsAmount = plan.installments
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);
      
      const totalPaid = plan.downPayment + paidInstallmentsAmount;
      const remaining = plan.totalAmount - totalPaid;
      const nextDueDate = plan.installments.find(i => i.status === 'pending')?.dueDate;
      const isCompleted = plan.installments.every(i => i.status === 'paid');

      return {
        ...plan,
        customerName: customer?.name || 'عميل محذوف',
        totalPaid,
        remainingOnPlan: remaining,
        nextDueDate,
        isCompleted
      };
    }).sort((a,b) => (a.nextDueDate && b.nextDueDate) ? new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime() : 0);
  }, [installmentPlans, customers]);
  
  const filteredPlans = useMemo(() => {
    let plans = plansWithDetails;
    if (filter === 'ongoing') plans = plans.filter(p => !p.isCompleted);
    if (filter === 'completed') plans = plans.filter(p => p.isCompleted);
    
    if (searchQuery.trim()) {
        plans = plans.filter(p => p.customerName.includes(searchQuery.trim()) || p.saleId.substring(1).includes(searchQuery.trim()));
    }

    return plans;
  }, [plansWithDetails, filter, searchQuery]);

  return (
    <div className="p-8 animate-fadeInUp">
      <PageHeader title="إدارة الأقساط">
        <div className="flex items-center gap-4 flex-wrap">
            <input 
                type="search"
                placeholder="ابحث بالاسم أو رقم الفاتورة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input-futuristic w-full sm:w-auto order-last sm:order-first"
            />
            <div className="flex rounded-md p-1 bg-black/20">
                <button onClick={() => setFilter('ongoing')} className={`p-2 px-4 text-center font-semibold rounded-md transition-all duration-300 ${filter === 'ongoing' ? 'bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black shadow-[0_0_10px_var(--accent-cyan)]' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}>جارية</button>
                <button onClick={() => setFilter('completed')} className={`p-2 px-4 text-center font-semibold rounded-md transition-all duration-300 ${filter === 'completed' ? 'bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black shadow-[0_0_10px_var(--accent-cyan)]' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}>مكتملة</button>
                <button onClick={() => setFilter('all')} className={`p-2 px-4 text-center font-semibold rounded-md transition-all duration-300 ${filter === 'all' ? 'bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black shadow-[0_0_10px_var(--accent-cyan)]' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}>الكل</button>
            </div>
        </div>
      </PageHeader>
      
      <div className="glass-card p-6 rounded-lg overflow-x-auto">
        <table className="w-full text-right">
            <thead className="border-b-2 border-[var(--accent-cyan)]">
                <tr>
                    <th className="p-3 text-lg text-[var(--accent-cyan)]">العميل</th>
                    <th className="p-3 text-lg text-[var(--accent-cyan)]">المبلغ الإجمالي</th>
                    <th className="p-3 text-lg text-[var(--accent-cyan)]">المتبقي</th>
                    <th className="p-3 text-lg text-[var(--accent-cyan)]">القسط القادم</th>
                    <th className="p-3 text-lg text-[var(--accent-cyan)]">الحالة</th>
                    <th className="p-3 text-lg text-[var(--accent-cyan)]">إجراءات</th>
                </tr>
            </thead>
            <tbody>
                {filteredPlans.map(plan => (
                     <tr key={plan.id} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                        <td className="p-3 font-medium">{plan.customerName}</td>
                        <td className="p-3 text-[var(--text-secondary)]">{plan.totalAmount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                        <td className="p-3 font-bold text-yellow-400">{plan.remainingOnPlan > 0 ? plan.remainingOnPlan.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' }) : "0.00 EGP"}</td>
                        <td className="p-3 text-[var(--text-secondary)]">{plan.nextDueDate ? new Date(plan.nextDueDate).toLocaleDateString('ar-EG') : ' - '}</td>
                        <td className="p-3">
                            {plan.isCompleted ? <span className="bg-green-500/20 text-green-300 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-500/50">مكتمل</span> : <span className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full border border-blue-500/50">نشط</span>}
                        </td>
                        <td className="p-3">
                            <button onClick={() => setSelectedPlan(plan)} className="text-blue-400 hover:underline">
                                عرض التفاصيل
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
      {selectedPlan && (
        <InstallmentDetailsModal 
            plan={selectedPlan}
            customer={customers.find(c => c.id === selectedPlan.customerId)!}
            onClose={() => setSelectedPlan(null)}
            onAddPayment={addPayment}
        />
      )}
    </div>
  );
};

export default Installments;