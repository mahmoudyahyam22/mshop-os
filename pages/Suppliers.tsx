import React, { useState, useMemo } from 'react';
import type { Supplier } from '../types';
import PageHeader from '../components/PageHeader';
import { PlusCircleIcon, EditIcon, TrashIcon, XIcon, SearchIcon } from '../components/icons';
import Portal from '../components/Portal';

interface SuppliersProps {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
}

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, addSupplier, updateSupplier, deleteSupplier }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Omit<Supplier, 'id'> | Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) return suppliers;
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery)
    );
  }, [suppliers, searchQuery]);


  const openAddModal = () => {
    setCurrentSupplier({ name: '', phone: '', address: '', contactPerson: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSupplier(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier || !currentSupplier.name || !currentSupplier.phone) {
        alert("اسم المورد والهاتف حقول مطلوبة.");
        return;
    };
    if ('id' in currentSupplier) {
      updateSupplier(currentSupplier);
    } else {
      addSupplier(currentSupplier);
    }
    closeModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentSupplier) return;
    const { name, value } = e.target;
    setCurrentSupplier({ ...currentSupplier, [name]: value });
  };

  return (
    <div className="p-8 animate-fadeInUp">
      <PageHeader title="إدارة الموردين">
         <div className="relative">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
          <input 
            type="search"
            placeholder="ابحث بالاسم أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input-futuristic w-full sm:w-64 pr-10"
          />
        </div>
        <button onClick={openAddModal} className="flex items-center bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-2 px-4 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300">
            <PlusCircleIcon className="w-5 h-5 me-2" />
            إضافة مورد جديد
        </button>
      </PageHeader>
      <div className="glass-card p-6 rounded-lg overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b-2 border-[var(--accent-cyan)]">
            <tr>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">اسم المورد</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">الهاتف</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">الشخص المسؤول</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">العنوان</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map(supplier => (
              <tr key={supplier.id} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                <td className="p-3 font-medium">{supplier.name}</td>
                <td className="p-3 text-[var(--text-secondary)]">{supplier.phone}</td>
                <td className="p-3 text-[var(--text-secondary)]">{supplier.contactPerson || '-'}</td>
                <td className="p-3 text-[var(--text-secondary)]">{supplier.address || '-'}</td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEditModal(supplier)} className="text-blue-400 hover:text-blue-500 transition-colors"><EditIcon className="w-5 h-5" /></button>
                    <button onClick={() => window.confirm(`هل أنت متأكد من حذف المورد ${supplier.name}؟`) && deleteSupplier(supplier.id)} className="text-red-400 hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
             {filteredSuppliers.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center p-8 text-[var(--text-secondary)]">
                        {suppliers.length === 0 ? "لا يوجد موردين حتى الآن." : "لم يتم العثور على موردين."}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && currentSupplier && (
        <Portal>
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] animate-fadeInUp" style={{animationDuration: '0.2s'}}>
            <div className="glass-card rounded-lg shadow-2xl p-8 w-full max-w-2xl border border-[var(--border-glow)] animate-modal-pop-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[var(--accent-cyan)]">{'id' in currentSupplier ? 'تعديل بيانات مورد' : 'إضافة مورد جديد'}</h3>
                <button onClick={closeModal} className="text-[var(--text-secondary)] hover:text-white"><XIcon className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">اسم المورد</label>
                      <input type="text" name="name" value={currentSupplier.name} onChange={handleChange} className="w-full form-input-futuristic" required />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">رقم الهاتف</label>
                      <input type="tel" name="phone" value={currentSupplier.phone} onChange={handleChange} className="w-full form-input-futuristic" required />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الشخص المسؤول (اختياري)</label>
                      <input type="text" name="contactPerson" value={currentSupplier.contactPerson || ''} onChange={handleChange} className="w-full form-input-futuristic" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">العنوان (اختياري)</label>
                      <input type="text" name="address" value={currentSupplier.address || ''} onChange={handleChange} className="w-full form-input-futuristic" />
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
    </div>
  );
};

export default Suppliers;