
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Sale, Product, ProductInstance, Purchase, Expense, InstallmentPlan, TreasuryTransaction, SalesReturn } from '../types';
import PageHeader from '../components/PageHeader';
import { ChartBarIcon, CoinIcon, ArchiveIcon } from '../components/icons';

// Note: Chart.js must be loaded via a script tag in index.html
declare var Chart: any;

// Helper functions for default date range
const getStartOfMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
};

const getToday = () => {
    return new Date().toISOString().split('T')[0];
};


const ReportCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="glass-card p-4 rounded-lg">
        <p className="text-sm text-[var(--text-secondary)]">{title}</p>
        <p className="text-2xl font-bold text-[var(--accent-cyan)]">{value}</p>
    </div>
);

const SalesChart: React.FC<{ sales: Sale[], timeframe: 'monthly' | 'daily' }> = ({ sales, timeframe }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current || sales.length === 0) {
            // Clear the canvas if there's no data
            const ctx = chartRef.current?.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }
            if(chartInstance.current) {
                chartInstance.current.destroy();
            }
            return;
        }
        
        const formatOptions: Intl.DateTimeFormatOptions = timeframe === 'monthly'
            ? { month: 'short', year: '2-digit' }
            : { day: 'numeric', month: 'short' };

        const salesByTime = sales.reduce((acc, sale) => {
            const key = new Date(sale.date).toLocaleDateString('ar-EG', formatOptions);
            acc[key] = (acc[key] || 0) + sale.totalAmount;
            return acc;
        }, {} as Record<string, number>);

        const sortedEntries = Object.entries(salesByTime).sort(([keyA], [keyB]) => {
            // A simple sort that may not be perfect for all date formats but works for these
            return new Date(keyA).getTime() - new Date(keyB).getTime();
        });

        const labels = sortedEntries.map(([key]) => key);
        const data = sortedEntries.map(([, value]) => value);

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'إجمالي المبيعات',
                    data,
                    backgroundColor: 'rgba(6, 182, 212, 0.6)',
                    borderColor: 'rgba(6, 182, 212, 1)',
                    borderWidth: 1,
                    borderRadius: 5,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#a0a0c0' }, grid: { display: false } },
                    y: { ticks: { color: '#a0a0c0' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [sales, timeframe]);

    return <canvas ref={chartRef} />;
};


interface ReportsProps {
  sales: Sale[];
  products: Product[];
  productInstances: ProductInstance[];
  purchases: Purchase[];
  expenses: Expense[];
  installmentPlans: InstallmentPlan[];
  treasuryTransactions: TreasuryTransaction[];
  salesReturns: SalesReturn[];
}

const Reports: React.FC<ReportsProps> = ({ sales, products, productInstances, purchases, expenses, installmentPlans, treasuryTransactions, salesReturns }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'financial' | 'inventory'>('sales');
  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(getToday());

  const filteredData = useMemo(() => {
    if (!startDate || !endDate) {
        return { sales, purchases, expenses, salesReturns };
    }
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredSales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= start && saleDate <= end;
    });
    const filteredPurchases = purchases.filter(p => {
        const purchaseDate = new Date(p.date);
        return purchaseDate >= start && purchaseDate <= end;
    });
    const filteredExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= start && expenseDate <= end;
    });
    const filteredSalesReturns = salesReturns.filter(r => {
        const returnDate = new Date(r.date);
        return returnDate >= start && returnDate <= end;
    });

    return {
        sales: filteredSales,
        purchases: filteredPurchases,
        expenses: filteredExpenses,
        salesReturns: filteredSalesReturns
    };
}, [sales, purchases, expenses, salesReturns, startDate, endDate]);
  
  const productsWithStock = useMemo(() => {
    return products.map(p => {
        if(p.isSerialized) {
            const stock = productInstances.filter(i => i.productId === p.id && i.status === 'in_stock').length;
            return {...p, stock};
        }
        return p;
    });
  }, [products, productInstances]);
  
  // Sales Report calculations
  const salesReport = useMemo(() => {
    const { sales: currentSales, salesReturns: currentReturns } = filteredData;
    const totalSalesValue = currentSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalReturnsValue = currentReturns.reduce((sum, r) => sum + r.totalRefundAmount, 0);
    const netSalesValue = totalSalesValue - totalReturnsValue;
    
    const totalProfitFromSales = currentSales.reduce((sum, s) => sum + (Number(s.profit) || 0), 0);
    const profitLostOnReturns = currentReturns.flatMap(r => r.items).reduce((sum, item) => sum + ((Number(item.unitPrice) || 0) - (Number(item.unitPurchasePrice) || 0)) * (Number(item.quantity) || 0), 0);
    const netProfit = totalProfitFromSales - profitLostOnReturns;

    const productSalesCount = currentSales.flatMap(s => s.items).reduce((acc, item) => {
        acc[item.productId] = (acc[item.productId] || 0) + (Number(item.quantity) || 0);
        return acc;
    }, {} as Record<string, number>);

    const topSelling = Object.entries(productSalesCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([productId, quantity]) => ({
            product: products.find(p => p.id === productId),
            quantity
        }));
        
    return { totalSalesValue, netSalesValue, netProfit, topSelling, salesCount: currentSales.length };
  }, [filteredData, products]);

  // Financial Report calculations
  const financialReport = useMemo(() => {
      const { purchases: currentPurchases, expenses: currentExpenses, salesReturns: currentReturns } = filteredData;
      const totalSalesIncome = salesReport.totalSalesValue;
      const totalReturns = currentReturns.reduce((sum, r) => sum + r.totalRefundAmount, 0);
      const netSales = totalSalesIncome - totalReturns;
      const totalPurchasesCost = currentPurchases.reduce((sum, p) => sum + (p.unitPurchasePrice * p.quantity), 0);
      const totalExpenses = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
      const finalNetProfit = salesReport.netProfit - totalExpenses;
      
      return { totalSalesIncome, totalReturns, netSales, totalPurchasesCost, totalExpenses, finalNetProfit };
  }, [salesReport, filteredData]);

  // Inventory Report calculations (not date-based, it's a snapshot)
  const inventoryReport = useMemo(() => {
      const totalValue = productsWithStock.reduce((sum, p) => sum + (p.purchasePrice * p.stock), 0);
      const totalItems = productsWithStock.reduce((sum, p) => sum + p.stock, 0);
      const outOfStock = productsWithStock.filter(p => p.stock === 0).length;
      return { totalValue, totalItems, outOfStock };
  }, [productsWithStock]);


  return (
    <div className="p-8 animate-fadeInUp">
      <PageHeader title="التقارير">
        <div className="flex items-center gap-4 flex-wrap bg-black/20 p-2 rounded-lg">
            <div>
                <label htmlFor="startDate" className="text-sm text-[var(--text-secondary)] me-2">من</label>
                <input 
                    id="startDate"
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className="form-input-futuristic bg-transparent border-gray-600 rounded-md p-2"
                />
            </div>
            <div>
                <label htmlFor="endDate" className="text-sm text-[var(--text-secondary)] me-2">إلى</label>
                <input 
                    id="endDate"
                    type="date" 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="form-input-futuristic bg-transparent border-gray-600 rounded-md p-2"
                />
            </div>
        </div>
      </PageHeader>
      
      <div className="mb-6 border-b border-[var(--border-glow)]">
        <nav className="-mb-px flex space-x-6 rtl:space-x-reverse">
            <button onClick={() => setActiveTab('sales')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-all ${activeTab === 'sales' ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'border-transparent text-[var(--text-secondary)]'}`}>تقرير المبيعات</button>
            <button onClick={() => setActiveTab('financial')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-all ${activeTab === 'financial' ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'border-transparent text-[var(--text-secondary)]'}`}>التقرير المالي</button>
            <button onClick={() => setActiveTab('inventory')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-all ${activeTab === 'inventory' ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'border-transparent text-[var(--text-secondary)]'}`}>تقرير المخزون</button>
        </nav>
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ReportCard title="إجمالي المبيعات" value={salesReport.totalSalesValue.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} />
                <ReportCard title="صافي المبيعات (بعد المرتجعات)" value={salesReport.netSalesValue.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} />
                <ReportCard title="إجمالي الأرباح (من المبيعات والفوائد)" value={salesReport.netProfit.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} />
                <ReportCard title="عدد الفواتير" value={salesReport.salesCount} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center"><ChartBarIcon className="w-6 h-6 me-2 text-cyan-400"/> المبيعات خلال الفترة</h3>
                    <div className="h-96">
                        <SalesChart sales={filteredData.sales} timeframe="monthly" />
                    </div>
                </div>
                <div className="glass-card p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">أكثر 5 منتجات مبيعاً</h3>
                    <div className="space-y-4">
                        {salesReport.topSelling.map(({ product, quantity }) => product ? (
                            <div key={product.id} className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                                <p className="font-semibold">{product.name}</p>
                                <p className="font-bold text-lg text-cyan-300">{quantity}</p>
                            </div>
                        ) : null)}
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'financial' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard title="إجمالي الإيرادات (المبيعات)" value={financialReport.totalSalesIncome.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} />
                <ReportCard title="إجمالي المرتجعات" value={financialReport.totalReturns.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} />
                <ReportCard title="صافي المبيعات" value={financialReport.netSales.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} />
                <ReportCard title="تكلفة المشتريات" value={financialReport.totalPurchasesCost.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} />
                <ReportCard title="المصروفات الأخرى" value={financialReport.totalExpenses.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} />
                <ReportCard title="صافي الربح النهائي" value={financialReport.finalNetProfit.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} />
            </div>
             <div className="glass-card p-6 rounded-lg">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">ملخص الفترة المحددة</h3>
                <p>هذا الملخص يعرض الأرقام المالية النهائية للفترة من <span className="font-bold text-cyan-300">{new Date(startDate).toLocaleDateString('ar-EG')}</span> إلى <span className="font-bold text-cyan-300">{new Date(endDate).toLocaleDateString('ar-EG')}</span>.</p>
            </div>
          </div>
      )}

      {activeTab === 'inventory' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReportCard title="قيمة المخزون (بسعر الشراء)" value={inventoryReport.totalValue.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} />
                <ReportCard title="إجمالي عدد القطع" value={inventoryReport.totalItems} />
                <ReportCard title="منتجات نفد مخزونها" value={inventoryReport.outOfStock} />
            </div>
            <div className="glass-card p-6 rounded-lg overflow-x-auto">
                 <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">حالة المخزون الحالية (لا تتأثر بالفلتر الزمني)</h3>
                 <table className="w-full text-right">
                    <thead className="border-b-2 border-[var(--accent-cyan)]">
                        <tr>
                            <th className="p-3 text-[var(--accent-cyan)]">المنتج</th>
                            <th className="p-3 text-[var(--accent-cyan)]">المخزون الحالي</th>
                            <th className="p-3 text-[var(--accent-cyan)]">سعر البيع</th>
                            <th className="p-3 text-[var(--accent-cyan)]">قيمة المخزون</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productsWithStock.map(p => (
                            <tr key={p.id} className="border-b border-white/10 hover:bg-white/5">
                                <td className="p-3 font-medium">{p.name}</td>
                                <td className={`p-3 font-bold ${p.stock <= 3 ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>{p.stock}</td>
                                <td className="p-3 text-[var(--text-secondary)]">{p.sellingPrice.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                                <td className="p-3 font-semibold text-green-400">{(p.purchasePrice * p.stock).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
          </div>
      )}

    </div>
  );
};

export default Reports;
