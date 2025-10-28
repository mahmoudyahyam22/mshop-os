import React, { useState } from 'react';
import type { Product, Purchase, Supplier } from '../types';
import PageHeader from '../components/PageHeader';
import Portal from '../components/Portal';
import { XIcon } from '../components/icons';

interface SerialNumberEntryModalProps {
    productName: string;
    quantity: number;
    onSubmit: (serials: string[]) => void;
    onClose: () => void;
}
const SerialNumberEntryModal: React.FC<SerialNumberEntryModalProps> = ({ productName, quantity, onSubmit, onClose }) => {
    const [serials, setSerials] = useState<string[]>(Array(quantity).fill(''));

    const handleSerialChange = (index: number, value: string) => {
        const newSerials = [...serials];
        newSerials[index] = value;
        setSerials(newSerials);
    };

    const handleSubmit = () => {
        if (serials.some(s => s.trim() === '')) {
            alert('يرجى إدخال جميع الأرقام التسلسلية.');
            return;
        }
        if (new Set(serials).size !== serials.length) {
            alert('تم إدخال أرقام تسلسلية مكررة. يرجى المراجعة.');
            return;
        }
        onSubmit(serials);
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] animate-fadeInUp" style={{animationDuration: '0.2s'}}>
                <div className="glass-card rounded-lg shadow-2xl p-8 w-full max-w-2xl border border-[var(--border-glow)] animate-modal-pop-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-[var(--accent-cyan)]">إدخال الأرقام التسلسلية لـ "{productName}"</h3>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white"><XIcon className="w-6 h-6" /></button>
                    </div>
                    <p className="text-[var(--text-secondary)] mb-6">يرجى إدخال الرقم التسلسلي (IMEI) لكل قطعة من الكمية المشتراة ({quantity} قطع).</p>
                    <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                        {Array.from({ length: quantity }).map((_, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <label className="w-8 text-right text-[var(--text-secondary)]">{index + 1}.</label>
                                <input
                                    type="text"
                                    value={serials[index]}
                                    onChange={(e) => handleSerialChange(index, e.target.value)}
                                    className="w-full form-input-futuristic font-mono"
                                    required
                                    autoFocus={index === 0}
                                />
                            </div>
                        ))}
                    </div>
                     <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="py-2 px-6 rounded-md text-[var(--text-secondary)] bg-black/20 hover:bg-white/10 transition-colors">إلغاء</button>
                        <button onClick={handleSubmit} className="py-2 px-6 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold rounded-md shadow-lg hover:shadow-[0_0_15px_var(--accent-cyan)] transition-shadow">تأكيد</button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};


interface PurchasesProps {
  products: Product[];
  purchases: Purchase[];
  suppliers: Supplier[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'date'>) => void;
}

const Purchases: React.FC<PurchasesProps> = ({ products, purchases, suppliers, addPurchase }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPurchasePrice, setUnitPurchasePrice] = useState<number>(0);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if(product) {
        setUnitPurchasePrice(product.purchasePrice);
    }
  };

  const handleAddPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === selectedProductId);

    if (!product || quantity <= 0 || unitPurchasePrice < 0) {
      alert('الرجاء إدخال بيانات صحيحة.');
      return;
    }

    if(product.isSerialized) {
        setIsSerialModalOpen(true);
    } else {
        addPurchase({ supplierId: supplierId || undefined, productId: selectedProductId, quantity, unitPurchasePrice, serialNumbers: [] });
        resetForm();
    }
  };
  
  const handleSerialSubmit = (serials: string[]) => {
      addPurchase({ supplierId: supplierId || undefined, productId: selectedProductId, quantity, unitPurchasePrice, serialNumbers: serials });
      setIsSerialModalOpen(false);
      resetForm();
  };

  const resetForm = () => {
    setSelectedProductId('');
    setSupplierId('');
    setQuantity(1);
    setUnitPurchasePrice(0);
  };
  
  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="p-8 animate-fadeInUp">
      <PageHeader title="إدارة المشتريات" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 glass-card p-6 rounded-lg h-fit">
          <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">تسجيل عملية شراء جديدة</h3>
          <form onSubmit={handleAddPurchase}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">المورد (اختياري)</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full form-input-futuristic">
                <option value="">-- بدون مورد --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">اختر المنتج</label>
              <select value={selectedProductId} onChange={e => handleProductChange(e.target.value)} className="w-full form-input-futuristic" required>
                <option value="">-- اختر منتج --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الكمية المشتراة</label>
              <input type="number" value={quantity} onChange={e => setQuantity(+e.target.value)} className="w-full form-input-futuristic" required min="1" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">سعر شراء الوحدة</label>
              <input type="number" value={unitPurchasePrice} onChange={e => setUnitPurchasePrice(+e.target.value)} className="w-full form-input-futuristic" required min="0"/>
            </div>
            <button type="submit" className="w-full mt-4 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-2 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300">
                تسجيل الشراء
            </button>
          </form>
        </div>
        <div className="lg:col-span-2 glass-card p-6 rounded-lg overflow-x-auto">
          <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">سجل المشتريات</h3>
          <table className="w-full text-right">
              <thead className="border-b-2 border-[var(--accent-cyan)]">
                  <tr>
                      <th className="p-3 text-lg text-[var(--accent-cyan)]">المنتج</th>
                      <th className="p-3 text-lg text-[var(--accent-cyan)]">المورد</th>
                      <th className="p-3 text-lg text-[var(--accent-cyan)]">الكمية</th>
                      <th className="p-3 text-lg text-[var(--accent-cyan)]">سعر الوحدة</th>
                      <th className="p-3 text-lg text-[var(--accent-cyan)]">الإجمالي</th>
                      <th className="p-3 text-lg text-[var(--accent-cyan)]">التاريخ</th>
                  </tr>
              </thead>
              <tbody>
                  {purchases.length === 0 && (
                      <tr>
                          <td colSpan={6} className="text-center p-8 text-[var(--text-secondary)]">لم يتم تسجيل أي عمليات شراء بعد.</td>
                      </tr>
                  )}
                  {purchases.slice().reverse().map(purchase => {
                      const product = products.find(p => p.id === purchase.productId);
                      const supplier = suppliers.find(s => s.id === purchase.supplierId);
                      return (
                          <tr key={purchase.id} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                              <td className="p-3">{product?.name || 'منتج محذوف'}</td>
                              <td className="p-3 text-[var(--text-secondary)]">{supplier?.name || '-'}</td>
                              <td className="p-3 text-[var(--text-secondary)]">{purchase.quantity}</td>
                              <td className="p-3 text-[var(--text-secondary)]">{purchase.unitPurchasePrice.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                              <td className="p-3 text-[var(--text-secondary)]">{(purchase.quantity * purchase.unitPurchasePrice).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                              <td className="p-3 text-[var(--text-secondary)]">{new Date(purchase.date).toLocaleDateString('ar-EG')}</td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
        </div>
      </div>
      {isSerialModalOpen && selectedProduct && (
        <SerialNumberEntryModal 
            productName={selectedProduct.name}
            quantity={quantity}
            onClose={() => setIsSerialModalOpen(false)}
            onSubmit={handleSerialSubmit}
        />
      )}
    </div>
  );
};

export default Purchases;