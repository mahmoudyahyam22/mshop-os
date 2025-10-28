import React, { useState, useMemo } from 'react';
import type { Customer } from '../types';
import PageHeader from '../components/PageHeader';
import { PlusCircleIcon, EditIcon, TrashIcon, XIcon, SearchIcon } from '../components/icons';
import Portal from '../components/Portal';

interface CustomersProps {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, addCustomer, updateCustomer, deleteCustomer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Omit<Customer, 'id'> | Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const openAddModal = () => {
    setCurrentCustomer({ name: '', phone: '', address: '', nationalId: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCustomer(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    if ('id' in currentCustomer) {
      updateCustomer(currentCustomer);
    } else {
      addCustomer(currentCustomer);
    }
    closeModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentCustomer) return;
    const { name, value } = e.target;
    setCurrentCustomer({ ...currentCustomer, [name]: value });
  };

  return (
    <div className="p-8 animate-fadeInUp">
      <PageHeader title="إدارة العملاء">
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
            إضافة عميل جديد
        </button>
      </PageHeader>
      <div className="glass-card p-6 rounded-lg overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b-2 border-[var(--accent-cyan)]">
            <tr>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">رقم العميل</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">الاسم</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">الهاتف</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">الرقم القومي</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">العنوان</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                <td className="p-3 font-bold text-center text-[var(--accent-cyan)]">{customer.id.substring(1)}</td>
                <td className="p-3 font-medium">{customer.name}</td>
                <td className="p-3 text-[var(--text-secondary)]">{customer.phone}</td>
                <td className="p-3 text-[var(--text-secondary)]">{customer.nationalId}</td>
                <td className="p-3 text-[var(--text-secondary)]">{customer.address}</td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEditModal(customer)} className="text-blue-400 hover:text-blue-500 transition-colors"><EditIcon className="w-5 h-5" /></button>
                    <button onClick={() => window.confirm(`هل أنت متأكد من حذف العميل ${customer.name}؟`) && deleteCustomer(customer.id)} className="text-red-400 hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
             {filteredCustomers.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center p-8 text-[var(--text-secondary)]">
                        {customers.length === 0 ? "لا يوجد عملاء حتى الآن." : "لم يتم العثور على عملاء."}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && currentCustomer && (
        <Portal>
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] animate-fadeInUp" style={{animationDuration: '0.2s'}}>
            <div className="glass-card rounded-lg shadow-2xl p-8 w-full max-w-2xl border border-[var(--border-glow)] animate-modal-pop-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[var(--accent-cyan)]">{'id' in currentCustomer ? 'تعديل بيانات عميل' : 'إضافة عميل جديد'}</h3>
                <button onClick={closeModal} className="text-[var(--text-secondary)] hover:text-white"><XIcon className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">اسم العميل</label>
                      <input type="text" name="name" value={currentCustomer.name} onChange={handleChange} className="w-full form-input-futuristic" required />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">رقم الهاتف</label>
                      <input type="tel" name="phone" value={currentCustomer.phone} onChange={handleChange} className="w-full form-input-futuristic" required />
                  </div>
                  <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الرقم القومي</label>
                      <input type="text" name="nationalId" value={currentCustomer.nationalId} onChange={handleChange} className="w-full form-input-futuristic" required />
                  </div>
                  <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">العنوان</label>
                      <input type="text" name="address" value={currentCustomer.address} onChange={handleChange} className="w-full form-input-futuristic" />
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

export default Customers;