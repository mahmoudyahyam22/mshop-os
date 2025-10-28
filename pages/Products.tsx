import React, { useState, useMemo } from 'react';
import type { Product, Permission, ProductInstance } from '../types';
import PageHeader from '../components/PageHeader';
import { PlusCircleIcon, EditIcon, TrashIcon, XIcon, ArchiveIcon, CoinIcon, BarcodeIcon, SearchIcon } from '../components/icons';
import Portal from '../components/Portal';

interface ProductsProps {
  products: Product[];
  productInstances: ProductInstance[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  hasPermission: (permission: Permission) => boolean;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; }> = ({ title, value, icon: Icon, }) => (
    <div className="glass-card p-4 rounded-lg flex items-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_15px_var(--accent-cyan)]">
      <div className={`p-3 rounded-full me-4 bg-cyan-500/30 shadow-[0_0_15px_var(--accent-cyan)]`}>
        <Icon className="w-6 h-6 text-[var(--accent-cyan)]" />
      </div>
      <div>
        <p className="text-sm text-[var(--text-secondary)]">{title}</p>
        <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  );
  
const SerialNumbersModal: React.FC<{product: Product, instances: ProductInstance[], onClose: () => void}> = ({product, instances, onClose}) => {
    return (
        <Portal>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[70] animate-fadeInUp" style={{animationDuration: '0.2s'}}>
                <div className="glass-card rounded-lg shadow-2xl p-8 w-full max-w-lg border border-[var(--border-glow)] animate-modal-pop-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-[var(--accent-cyan)]">الأرقام التسلسلية لـ {product.name}</h3>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white"><XIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="max-h-80 overflow-y-auto bg-black/20 p-4 rounded-lg">
                        <ul className="list-disc list-inside space-y-2">
                            {instances.filter(i => i.status === 'in_stock').map(inst => (
                                <li key={inst.id} className="text-[var(--text-primary)] font-mono">{inst.serialNumber}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

const Products: React.FC<ProductsProps> = ({ products, productInstances, addProduct, updateProduct, deleteProduct, hasPermission }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSerialsModalOpen, setIsSerialsModalOpen] = useState<Product | null>(null);
  const [currentProduct, setCurrentProduct] = useState<Omit<Product, 'id'> | Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const productsWithStock = useMemo(() => {
    return products.map(p => {
        if(p.isSerialized) {
            const stock = productInstances.filter(i => i.productId === p.id && i.status === 'in_stock').length;
            return {...p, stock};
        }
        return p;
    });
  }, [products, productInstances]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return productsWithStock;
    return productsWithStock.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery)
    );
  }, [productsWithStock, searchQuery]);

  const inventoryStats = useMemo(() => {
    const totalValue = productsWithStock.reduce((sum, p) => sum + (p.purchasePrice * p.stock), 0);
    const totalItems = productsWithStock.reduce((sum, p) => sum + p.stock, 0);
    const uniqueItems = products.length;
    return { totalValue, totalItems, uniqueItems };
  }, [productsWithStock]);


  const openAddModal = () => {
    setCurrentProduct({ name: '', brand: '', description: '', purchasePrice: 0, sellingPrice: 0, stock: 0, isSerialized: false, barcode: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;
    if ('id' in currentProduct) {
      updateProduct(currentProduct);
    } else {
      addProduct(currentProduct);
    }
    closeModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!currentProduct) return;
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setCurrentProduct({ ...currentProduct, [name]: checked, stock: 0 }); // Reset stock when changing serialization
    } else {
        setCurrentProduct({
            ...currentProduct,
            [name]: (name === 'purchasePrice' || name === 'sellingPrice' || name === 'stock') ? Number(value) : value,
        });
    }
  };

  return (
    <div className="p-8 animate-fadeInUp">
      <PageHeader title="إدارة المنتجات">
        <div className="relative">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
          <input 
            type="search"
            placeholder="ابحث بالاسم أو الباركود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input-futuristic w-full sm:w-64 pr-10"
          />
        </div>
         <button onClick={openAddModal} className="flex items-center bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-2 px-4 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300">
            <PlusCircleIcon className="w-5 h-5 me-2" />
            إضافة منتج جديد
        </button>
      </PageHeader>
      
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="إجمالي قيمة المخزون" value={inventoryStats.totalValue.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} icon={CoinIcon} />
        <StatCard title="إجمالي عدد القطع" value={inventoryStats.totalItems.toLocaleString('ar-EG')} icon={ArchiveIcon} />
        <StatCard title="عدد المنتجات الفريدة" value={inventoryStats.uniqueItems.toLocaleString('ar-EG')} icon={PlusCircleIcon} />
      </div>

      <div className="glass-card p-6 rounded-lg overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b-2 border-[var(--accent-cyan)]">
            <tr>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">الاسم</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">الماركة</th>
              {hasPermission('view_purchase_price') && <th className="p-3 text-lg text-[var(--accent-cyan)]">سعر الشراء</th>}
              <th className="p-3 text-lg text-[var(--accent-cyan)]">سعر البيع</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">المخزون</th>
              {hasPermission('view_purchase_price') && <th className="p-3 text-lg text-[var(--accent-cyan)]">إجمالي القيمة</th>}
              <th className="p-3 text-lg text-[var(--accent-cyan)]">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                <td className="p-3 font-medium">{product.name}</td>
                <td className="p-3 text-[var(--text-secondary)]">{product.brand}</td>
                {hasPermission('view_purchase_price') && <td className="p-3 text-[var(--text-secondary)]">{product.purchasePrice.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>}
                <td className="p-3 text-[var(--text-secondary)]">{product.sellingPrice.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                <td className={`p-3 font-bold ${product.stock < 5 ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                    {product.stock}
                    {product.isSerialized && <button onClick={() => setIsSerialsModalOpen(product)} className="ms-2 text-xs text-blue-400 hover:underline">(عرض)</button>}
                </td>
                {hasPermission('view_purchase_price') && <td className="p-3 font-semibold text-green-400">
                  {(product.purchasePrice * product.stock).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}
                </td>}
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEditModal(product)} className="text-blue-400 hover:text-blue-500 transition-colors"><EditIcon className="w-5 h-5" /></button>
                    <button onClick={() => window.confirm(`هل أنت متأكد من حذف ${product.name}؟`) && deleteProduct(product.id)} className="text-red-400 hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
             {filteredProducts.length === 0 && (
                <tr>
                    <td colSpan={hasPermission('view_purchase_price') ? 7 : 5} className="text-center p-8 text-[var(--text-secondary)]">
                        {products.length === 0 ? "لا توجد منتجات حتى الآن." : "لم يتم العثور على منتجات تطابق بحثك."}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && currentProduct && (
        <Portal>
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] animate-fadeInUp" style={{animationDuration: '0.2s'}}>
            <div className="glass-card rounded-lg shadow-2xl p-8 w-full max-w-3xl border border-[var(--border-glow)] animate-modal-pop-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[var(--accent-cyan)]">{'id' in currentProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}</h3>
                <button onClick={closeModal} className="text-[var(--text-secondary)] hover:text-white"><XIcon className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">اسم المنتج</label>
                      <input type="text" name="name" value={currentProduct.name} onChange={handleChange} className="w-full form-input-futuristic" required />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الماركة</label>
                      <input type="text" name="brand" value={currentProduct.brand} onChange={handleChange} className="w-full form-input-futuristic" required />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الباركود</label>
                      <input type="text" name="barcode" value={currentProduct.barcode || ''} onChange={handleChange} className="w-full form-input-futuristic" />
                  </div>
                  <div>
                    <label className="flex items-center space-x-3 rtl:space-x-reverse mt-8 cursor-pointer">
                        <input type="checkbox" name="isSerialized" checked={currentProduct.isSerialized} onChange={handleChange} className="w-5 h-5 accent-[var(--accent-cyan)]" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">منتج يخضع للرقم التسلسلي (IMEI)</span>
                    </label>
                  </div>
                  {hasPermission('view_purchase_price') && <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">سعر الشراء</label>
                      <input type="number" name="purchasePrice" value={currentProduct.purchasePrice} onChange={handleChange} className="w-full form-input-futuristic" required />
                  </div>}
                  <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">سعر البيع</label>
                      <input type="number" name="sellingPrice" value={currentProduct.sellingPrice} onChange={handleChange} className="w-full form-input-futuristic" required />
                  </div>
                  {!currentProduct.isSerialized && (
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الكمية بالمخزون</label>
                        <input type="number" name="stock" value={currentProduct.stock} onChange={handleChange} className="w-full form-input-futuristic" required disabled={currentProduct.isSerialized}/>
                    </div>
                  )}
                  <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الوصف</label>
                      <textarea name="description" value={currentProduct.description} onChange={handleChange} className="w-full form-input-futuristic" rows={3}></textarea>
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button type="button" onClick={closeModal} className="py-2 px-4 rounded-md text-[var(--text-secondary)] bg-black/20 hover:bg-white/10 transition-colors">إلغاء</button>
                  <button type="submit" className="bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-2 px-4 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300">حفظ</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
      {isSerialsModalOpen && <SerialNumbersModal product={isSerialsModalOpen} instances={productInstances.filter(i => i.productId === isSerialsModalOpen.id)} onClose={() => setIsSerialsModalOpen(null)} />}
    </div>
  );
};

export default Products;