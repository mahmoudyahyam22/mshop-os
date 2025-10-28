

import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Sale, Product, Customer, InstallmentPlan, Page, Installment, CashTransferTransaction, CashTransferAccount, ProductInstance } from '../types';
import { CustomerIcon, InstallmentsIcon, ProductIcon, SalesIcon, PurchasesIcon, TrendingUpIcon, TransferIcon, ChartBarIcon, ScaleIcon } from '../components/icons';
import PageHeader from '../components/PageHeader';
// Note: Chart.js must be loaded via a script tag in index.html
declare var Chart: any;


interface DashboardProps {
  sales: Sale[];
  products: Product[];
  productInstances: ProductInstance[];
  customers: Customer[];
  installmentPlans: InstallmentPlan[];
  cashTransferTransactions: CashTransferTransaction[];
  cashTransferAccounts: CashTransferAccount[];
  setActivePage: (page: Page) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string; glowColor: string; children?: React.ReactNode; }> = ({ title, value, icon: Icon, color, glowColor, children }) => (
  <div className="glass-card p-6 rounded-lg flex items-start transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_0_25px_var(--accent-glow)]">
    <div className={`p-3 rounded-full me-4 ${color} shadow-[0_0_15px_${glowColor}]`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <div>
      <p className="text-sm text-[var(--text-secondary)]">{title}</p>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      {children}
    </div>
  </div>
);

const QuickActionButton: React.FC<{
  label: string;
  icon: React.ElementType;
  glowClass: string;
  onClick: () => void;
}> = ({ label, icon: Icon, glowClass, onClick }) => (
    <button
        onClick={onClick}
        className={`glass-card flex flex-col items-center justify-center p-4 rounded-lg transition-transform transform hover:-translate-y-1 hover:shadow-[0_0_15px_var(--accent-cyan)] text-[var(--text-primary)]`}
    >
        <Icon className={`w-8 h-8 mb-2 ${glowClass}`} />
        <span className="font-semibold">{label}</span>
    </button>
);

const SalesChart: React.FC<{ sales: Sale[] }> = ({ sales }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const monthlySales = sales.reduce((acc, sale) => {
            const month = new Date(sale.date).toLocaleString('default', { month: 'short', year: '2-digit' });
            acc[month] = (acc[month] || 0) + sale.totalAmount;
            return acc;
        }, {} as { [key: string]: number });

        const labels = Object.keys(monthlySales).reverse();
        const data = Object.values(monthlySales).reverse();

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'إجمالي المبيعات',
                    data,
                    borderColor: 'rgba(0, 255, 255, 0.8)',
                    backgroundColor: 'rgba(0, 255, 255, 0.2)',
                    fill: true,
                    tension: 0.4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#a0a0c0' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    y: { ticks: { color: '#a0a0c0' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [sales]);

    return <canvas ref={chartRef} />;
};


const Dashboard: React.FC<DashboardProps> = ({ sales, products, productInstances, customers, installmentPlans, setActivePage, cashTransferTransactions }) => {
  const [activeInfoTab, setActiveInfoTab] = useState<'alerts' | 'sales'>('alerts');

  const productsWithStock = useMemo(() => {
    return products.map(p => {
        if(p.isSerialized) {
            const stock = productInstances.filter(i => i.productId === p.id && i.status === 'in_stock').length;
            return {...p, stock};
        }
        return p;
    });
  }, [products, productInstances]);

  const totalSalesValue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
  const totalInstallmentDebt = installmentPlans.reduce((sum, plan) => sum + (plan.remainingAmount > 0 ? plan.remainingAmount : 0), 0);
  // FIX: Ensured profit calculation is robust by safely converting potential non-numeric values.
  const totalProfit = sales.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0); // This already includes interest

  const installmentProfits = useMemo(() => {
    let realized = 0;
    let totalInterest = 0;

    installmentPlans.forEach(plan => {
        // FIX: Use `Number(val || 0)` pattern to safely handle potentially undefined or non-numeric values.
        totalInterest += (Number(plan.interestAmount || 0));
        if ((Number(plan.numberOfMonths || 0)) > 0) {
            const profitPerInstallment = (Number(plan.interestAmount || 0)) / (Number(plan.numberOfMonths || 1));
            const paidInstallmentsCount = plan.installments.filter(i => i.status === 'paid').length;
            realized += paidInstallmentsCount * profitPerInstallment;
        }
    });

    const unrealized = totalInterest - realized;

    return { realized, unrealized };
  }, [installmentPlans]);


  const topSellingProducts = useMemo(() => {
    const productSales = sales.flatMap(s => s.items).reduce((acc, item) => {
      acc[item.productId] = (acc[item.productId] || 0) + (Number(item.quantity) || 0);
      return acc;
    }, {} as {[key: string]: number});

    return Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([productId, quantity]) => ({
        product: products.find(p => p.id === productId),
        quantity
      }));
  }, [sales, products]);

  const lowStockProducts = useMemo(() => {
      return productsWithStock.filter(p => p.stock > 0 && p.stock <= 3);
  }, [productsWithStock]);

  const installmentAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingDate = new Date(today);
    upcomingDate.setDate(today.getDate() + 7);

    const overdue: (Installment & { customerName?: string })[] = [];
    const upcoming: (Installment & { customerName?: string })[] = [];

    installmentPlans.forEach(plan => {
      const customer = customers.find(c => c.id === plan.customerId);
      plan.installments.forEach(inst => {
        if (inst.status === 'pending') {
          const dueDate = new Date(inst.dueDate);
          if (dueDate < today) {
            overdue.push({ ...inst, customerName: customer?.name });
          } else if (dueDate <= upcomingDate) {
            upcoming.push({ ...inst, customerName: customer?.name });
          }
        }
      });
    });

    return { overdue, upcoming };
  }, [installmentPlans, customers]);


  return (
    <div className="p-8 animate-fadeInUp">
       <PageHeader title="لوحة التحكم" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="إجمالي المبيعات" value={totalSalesValue} icon={SalesIcon} color="bg-blue-500/50" glowColor="rgb(59 130 246)" />
        <StatCard title="إجمالي الأرباح (من البيع)" value={totalProfit.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} icon={TrendingUpIcon} color="bg-cyan-500/50" glowColor="rgb(6 182 212)"/>
        <StatCard title="ديون الأقساط" value={totalInstallmentDebt.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} icon={InstallmentsIcon} color="bg-red-500/50" glowColor="rgb(239 68 68)" />
        <StatCard title="أرباح مستحقة من الأقساط" value={installmentProfits.realized.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} icon={TrendingUpIcon} color="bg-emerald-500/50" glowColor="rgb(16 185 129)" />
        <StatCard title="أرباح غير مستحقة من الأقساط" value={installmentProfits.unrealized.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} icon={ScaleIcon} color="bg-orange-500/50" glowColor="rgb(249 115 22)" />
        <StatCard title="أرباح تحويلات الكاش" value={cashTransferTransactions.reduce((s,t)=>s+(Number(t.commission) || 0),0).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} icon={TransferIcon} color="bg-teal-500/50" glowColor="rgb(20 184 166)" />
        <StatCard title="عدد المنتجات" value={products.length} icon={ProductIcon} color="bg-green-500/50" glowColor="rgb(34 197 94)" />
        <StatCard title="عدد العملاء" value={customers.length} icon={CustomerIcon} color="bg-purple-500/50" glowColor="rgb(168 85 247)" />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 glass-card p-6 rounded-lg">
           <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center"><ChartBarIcon className="w-6 h-6 me-2 text-cyan-400"/> تطور المبيعات</h3>
           <div className="h-80">
                <SalesChart sales={sales} />
           </div>
        </div>
        <div className="glass-card p-6 rounded-lg">
             <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">أكثر المنتجات مبيعاً</h3>
             <div className="space-y-4">
                {topSellingProducts.map(({product, quantity}) => product ? (
                    <div key={product.id} className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                        <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{product.brand}</p>
                        </div>
                        <p className="font-bold text-lg text-cyan-300">{quantity} <span className="text-xs">قطعة</span></p>
                    </div>
                ): null)}
             </div>
        </div>
       </div>


      <div className="mb-10 glass-card p-6 rounded-lg">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">إجراءات سريعة</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              <QuickActionButton label="فاتورة بيع" icon={SalesIcon} glowClass="text-blue-400" onClick={() => setActivePage('sales')} />
              <QuickActionButton label="إضافة منتج" icon={ProductIcon} glowClass="text-green-400" onClick={() => setActivePage('products')} />
              <QuickActionButton label="إضافة عميل" icon={CustomerIcon} glowClass="text-purple-400" onClick={() => setActivePage('customers')} />
              <QuickActionButton label="تسجيل مشتريات" icon={PurchasesIcon} glowClass="text-orange-400" onClick={() => setActivePage('purchases')} />
              <QuickActionButton label="تحويل كاش" icon={TransferIcon} glowClass="text-teal-400" onClick={() => setActivePage('cashTransfers')} />
              <QuickActionButton label="فاتورة مرتجع" icon={InstallmentsIcon} glowClass="text-pink-400" onClick={() => setActivePage('returns')} />
          </div>
      </div>

       <div className="glass-card p-6 rounded-lg">
            <div className="flex border-b border-[var(--border-glow)] mb-4">
                <button onClick={() => setActiveInfoTab('alerts')} className={`py-2 px-4 font-semibold transition-colors relative ${activeInfoTab==='alerts' ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] hover:text-white'}`}>
                    تنبيهات هامة
                    {(installmentAlerts.overdue.length > 0 || lowStockProducts.length > 0) && <span className="absolute top-1 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>}
                    {activeInfoTab==='alerts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-cyan)]"></div>}
                </button>
                <button onClick={() => setActiveInfoTab('sales')} className={`py-2 px-4 font-semibold transition-colors relative ${activeInfoTab==='sales' ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] hover:text-white'}`}>
                    آخر المبيعات
                    {activeInfoTab==='sales' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-cyan)]"></div>}
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {activeInfoTab === 'alerts' && (
                     <div className="space-y-4">
                        {lowStockProducts.length === 0 && installmentAlerts.overdue.length === 0 && installmentAlerts.upcoming.length === 0 && (
                            <p className="text-[var(--text-secondary)] text-center py-4">لا توجد تنبيهات حالية.</p>
                        )}
                        {lowStockProducts.length > 0 && (
                             <div>
                                <h4 className="font-bold text-yellow-500 mb-2">منتجات قارب مخزونها على الانتهاء</h4>
                                {lowStockProducts.map(p => (
                                     <div key={p.id} onClick={() => setActivePage('products')} className="cursor-pointer flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg mb-2 hover:bg-yellow-500/20 border border-yellow-500/20">
                                        <p className="font-semibold">{p.name}</p>
                                        <p className="font-bold text-yellow-400">المتبقي: {p.stock}</p>
                                     </div>
                                ))}
                             </div>
                        )}
                        {installmentAlerts.overdue.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-red-500 mb-2 mt-4">أقساط متأخرة</h4>
                                    {installmentAlerts.overdue.map(inst => (
                                     <div key={inst.id} onClick={() => setActivePage('installments')} className="cursor-pointer flex justify-between items-center p-3 bg-red-500/10 rounded-lg mb-2 hover:bg-red-500/20 border border-red-500/20">
                                        <p className="font-semibold">{inst.customerName} - {new Date(inst.dueDate).toLocaleDateString('ar-EG')}</p>
                                        <p className="font-bold text-red-400">{inst.amount.toLocaleString('ar-EG',{style:'currency', currency:'EGP'})}</p>
                                     </div>
                                    ))}
                                </div>
                        )}
                        {installmentAlerts.upcoming.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-blue-500 mb-2 mt-4">أقساط قادمة</h4>
                                    {installmentAlerts.upcoming.map(inst => (
                                     <div key={inst.id} onClick={() => setActivePage('installments')} className="cursor-pointer flex justify-between items-center p-3 bg-blue-500/10 rounded-lg mb-2 hover:bg-blue-500/20 border border-blue-500/20">
                                        <p className="font-semibold">{inst.customerName} - {new Date(inst.dueDate).toLocaleDateString('ar-EG')}</p>
                                        <p className="font-bold text-blue-400">{inst.amount.toLocaleString('ar-EG',{style:'currency', currency:'EGP'})}</p>
                                     </div>
                                    ))}
                                </div>
                        )}
                    </div>
                )}
                 {activeInfoTab === 'sales' && (
                     <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="border-b border-white/10">
                                <tr>
                                    <th className="p-2 font-semibold">فاتورة #</th>
                                    <th className="p-2 font-semibold">العميل</th>
                                    <th className="p-2 font-semibold">الإجمالي</th>
                                    <th className="p-2 font-semibold">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.slice().reverse().slice(0, 10).map(sale => {
                                    const customer = customers.find(c => c.id === sale.customerId);
                                    return (
                                        <tr key={sale.id} className="border-b border-white/5">
                                            <td className="p-2 text-cyan-400">#{sale.id.substring(5)}</td>
                                            <td className="p-2">{customer?.name || 'عميل نقدي'}</td>
                                            <td className="p-2">{sale.totalAmount.toLocaleString('ar-EG',{style:'currency', currency:'EGP'})}</td>
                                            <td className="p-2 text-sm text-[var(--text-secondary)]">{new Date(sale.date).toLocaleDateString('ar-EG')}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                 )}
            </div>
       </div>
    </div>
  );
};

export default Dashboard;