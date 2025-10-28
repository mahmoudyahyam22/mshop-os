import React, { useState, useMemo } from 'react';
import type { SalesReturn, Sale, Product, Customer, SalesReturnItem } from '../types';
import PageHeader from '../components/PageHeader';
import { SearchIcon } from '../components/icons';

interface ReturnsProps {
  salesReturns: SalesReturn[];
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  createSalesReturn: (returnData: Omit<SalesReturn, 'id' | 'date'>) => void;
}

const Returns: React.FC<ReturnsProps> = ({ salesReturns, sales, products, customers, createSalesReturn }) => {
  const [searchSaleId, setSearchSaleId] = useState('');
  const [foundSale, setFoundSale] = useState<Sale | null>(null);
  const [itemsToReturn, setItemsToReturn] = useState<SalesReturnItem[]>([]);
  
  const handleSearchSale = () => {
    const sale = sales.find(s => s.id.toLowerCase().includes(searchSaleId.toLowerCase()));
    if (sale) {
      setFoundSale(sale);
      // Initialize items to return with quantity 0
      setItemsToReturn(sale.items.map(item => ({...item, quantity: 0})));
    } else {
      alert('لم يتم العثور على فاتورة بهذا الرقم.');
      setFoundSale(null);
      setItemsToReturn([]);
    }
  };

  const handleReturnQuantityChange = (productId: string, serialNumber: string | undefined, newQuantity: number) => {
    const originalItem = foundSale?.items.find(i => i.productId === productId && i.serialNumber === serialNumber);
    if (!originalItem) return;

    const cappedQuantity = Math.min(originalItem.quantity, Math.max(0, newQuantity));

    setItemsToReturn(prev => prev.map(item => 
      (item.productId === productId && item.serialNumber === serialNumber)
        ? { ...item, quantity: cappedQuantity }
        : item
    ));
  };
  
  const totalRefund = useMemo(() => {
    return itemsToReturn.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }, [itemsToReturn]);

  const handleProcessReturn = () => {
    if (!foundSale) return;
    const finalItemsToReturn = itemsToReturn.filter(item => item.quantity > 0);
    if (finalItemsToReturn.length === 0) {
      alert('لم يتم تحديد أي منتجات للإرجاع.');
      return;
    }
    
    createSalesReturn({
      originalSaleId: foundSale.id,
      customerId: foundSale.customerId,
      items: finalItemsToReturn,
      totalRefundAmount: totalRefund,
    });

    // Reset form
    setSearchSaleId('');
    setFoundSale(null);
    setItemsToReturn([]);
  };

  return (
    <div className="p-8 animate-fadeInUp">
      <PageHeader title="إدارة المرتجعات" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* New Return Form */}
        <div className="lg:col-span-1 glass-card p-6 rounded-lg h-fit">
          <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">إنشاء فاتورة مرتجع</h3>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="ابحث برقم الفاتورة الأصلي"
              value={searchSaleId}
              onChange={e => setSearchSaleId(e.target.value)}
              className="w-full form-input-futuristic"
            />
            <button onClick={handleSearchSale} className="bg-blue-500/80 p-2 rounded-md text-white"><SearchIcon className="w-5 h-5"/></button>
          </div>

          {foundSale && (
            <div>
              <p className="text-sm text-cyan-300 mb-2">الفاتورة موجودة: العميل - {customers.find(c => c.id === foundSale.customerId)?.name || 'نقدي'}</p>
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {itemsToReturn.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  const originalSaleItem = foundSale.items.find(i => i.productId === item.productId && i.serialNumber === item.serialNumber);
                  return (
                    <div key={index} className="bg-black/20 p-2 rounded-md flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold">{product?.name}</p>
                        <p className="text-xs text-gray-400">{item.serialNumber || `السعر: ${item.unitPrice}`}</p>
                      </div>
                      <input 
                        type="number"
                        value={item.quantity}
                        onChange={e => handleReturnQuantityChange(item.productId, item.serialNumber, +e.target.value)}
                        className="w-16 bg-transparent border-b text-center"
                        max={originalSaleItem?.quantity}
                        min="0"
                        disabled={!!item.serialNumber}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-[var(--border-glow)] pt-4 space-y-2">
                 <div className="flex justify-between font-bold text-lg">
                    <span className="text-[var(--text-secondary)]">إجمالي المرتجع:</span>
                    <span className="text-red-400">{totalRefund.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</span>
                </div>
                 <button onClick={handleProcessReturn} className="w-full mt-2 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-2 rounded-md shadow-lg">
                    إتمام المرتجع
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Returns History */}
        <div className="lg:col-span-2 glass-card p-6 rounded-lg overflow-x-auto">
          <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">سجل المرتجعات</h3>
           <table className="w-full text-right">
              <thead className="border-b-2 border-[var(--accent-cyan)]">
                  <tr>
                      <th className="p-3 text-[var(--accent-cyan)]">التاريخ</th>
                      <th className="p-3 text-[var(--accent-cyan)]">العميل</th>
                      <th className="p-3 text-[var(--accent-cyan)]">الفاتورة الأصلية</th>
                      <th className="p-3 text-[var(--accent-cyan)]">قيمة المرتجع</th>
                  </tr>
              </thead>
              <tbody>
                   {salesReturns.length === 0 && (
                      <tr>
                          <td colSpan={4} className="text-center p-8 text-[var(--text-secondary)]">لم يتم تسجيل أي مرتجعات بعد.</td>
                      </tr>
                  )}
                  {salesReturns.slice().reverse().map(ret => {
                      const customer = customers.find(c => c.id === ret.customerId);
                      return (
                          <tr key={ret.id} className="border-b border-white/10 hover:bg-white/5">
                              <td className="p-3 text-sm">{new Date(ret.date).toLocaleDateString('ar-EG')}</td>
                              <td className="p-3">{customer?.name || 'نقدي'}</td>
                              <td className="p-3 text-cyan-400">#{ret.originalSaleId.substring(1)}</td>
                              <td className="p-3 font-semibold text-red-400">{ret.totalRefundAmount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                          </tr>
                      );
                  })}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default Returns;