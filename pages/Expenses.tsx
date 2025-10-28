import React, { useState, useMemo } from 'react';
import type { Expense, ExpenseCategory } from '../types';
import PageHeader from '../components/PageHeader';
import { PlusCircleIcon } from '../components/icons';

interface ExpensesProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  addCategory: (category: Omit<ExpenseCategory, 'id'>) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, categories, addExpense, addCategory }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [categoryId, setCategoryId] = useState<string>('');
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    if (newCategory.trim()) {
        addCategory({ name: newCategory.trim() });
        setNewCategory('');
    }
  };
  
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0 || !categoryId) {
        alert('يرجى ملء جميع الحقول بشكل صحيح.');
        return;
    }
    addExpense({ description, amount, categoryId });
    // Reset form
    setDescription('');
    setAmount(0);
    setCategoryId('');
  };

  const totalExpenses = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);
  
  return (
    <div className="p-8 animate-fadeInUp">
      <PageHeader title="إدارة المصروفات" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            <div className="glass-card p-6 rounded-lg h-fit">
                <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">تسجيل مصروف جديد</h3>
                <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">فئة المصروف</label>
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full form-input-futuristic" required>
                            <option value="">-- اختر فئة --</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">المبلغ</label>
                        <input type="number" value={amount} onChange={e => setAmount(Math.max(0, +e.target.value))} className="w-full form-input-futuristic" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الوصف</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full form-input-futuristic" rows={3} required />
                    </div>
                     <button type="submit" className="w-full mt-2 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-2 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300">
                        تسجيل المصروف
                    </button>
                </form>
            </div>
             <div className="glass-card p-6 rounded-lg h-fit">
                <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">إدارة الفئات</h3>
                <div className="space-y-2 mb-4">
                    {categories.map(c => <div key={c.id} className="bg-black/20 p-2 rounded text-sm text-center">{c.name}</div>)}
                </div>
                <div className="flex gap-2">
                    <input type="text" placeholder="اسم الفئة الجديدة" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full form-input-futuristic" />
                    <button onClick={handleAddCategory} className="bg-green-500/80 text-white p-2 rounded-md"><PlusCircleIcon className="w-5 h-5"/></button>
                </div>
            </div>
        </div>
        <div className="lg:col-span-2 glass-card p-6 rounded-lg overflow-x-auto">
          <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
            سجل المصروفات (الإجمالي: {totalExpenses.toLocaleString('ar-EG', {style: 'currency', currency: 'EGP'})})
          </h3>
          <table className="w-full text-right">
              <thead className="border-b-2 border-[var(--accent-cyan)]">
                  <tr>
                      <th className="p-3 text-lg text-[var(--accent-cyan)]">التاريخ</th>
                      <th className="p-3 text-lg text-[var(--accent-cyan)]">الفئة</th>
                      <th className="p-3 text-lg text-[var(--accent-cyan)]">الوصف</th>
                      <th className="p-3 text-lg text-[var(--accent-cyan)]">المبلغ</th>
                  </tr>
              </thead>
              <tbody>
                  {expenses.slice().reverse().map(exp => {
                      const category = categories.find(c => c.id === exp.categoryId);
                      return (
                          <tr key={exp.id} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                              <td className="p-3 text-[var(--text-secondary)]">{new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                              <td className="p-3 text-[var(--text-secondary)]">{category?.name || 'غير محدد'}</td>
                              <td className="p-3">{exp.description}</td>
                              <td className="p-3 font-semibold text-red-400">{exp.amount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
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

export default Expenses;