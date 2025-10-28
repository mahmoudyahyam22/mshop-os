import React, { useState, useMemo } from 'react';
import type { MaintenanceJob } from '../types';
import PageHeader from '../components/PageHeader';
import { PlusCircleIcon, XIcon } from '../components/icons';
import Portal from '../components/Portal';

interface MaintenanceProps {
  jobs: MaintenanceJob[];
  addJob: (job: Omit<MaintenanceJob, 'id' | 'status' | 'receivedDate'>) => void;
  updateJobStatus: (jobId: string, newStatus: MaintenanceJob['status']) => void;
}

const MaintenanceModal: React.FC<{
    onClose: () => void;
    onSave: (job: Omit<MaintenanceJob, 'id' | 'status' | 'receivedDate'>) => void;
}> = ({ onClose, onSave }) => {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [deviceType, setDeviceType] = useState('');
    const [problemDescription, setProblemDescription] = useState('');
    const [cost, setCost] = useState(0);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if(!customerName || !customerPhone || !deviceType || !problemDescription || cost < 0) {
            alert('يرجى ملء جميع الحقول المطلوبة بشكل صحيح.');
            return;
        }
        onSave({ customerName, customerPhone, deviceType, problemDescription, cost });
        onClose();
    };

    return (
         <Portal>
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] animate-fadeInUp" style={{animationDuration: '0.2s'}}>
            <div className="glass-card rounded-lg shadow-2xl p-8 w-full max-w-2xl border border-[var(--border-glow)] animate-modal-pop-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[var(--accent-cyan)]">استلام جهاز جديد للصيانة</h3>
                <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white"><XIcon className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">اسم العميل</label>
                      <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full form-input-futuristic" required />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">رقم هاتف العميل</label>
                      <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full form-input-futuristic" required />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">نوع الجهاز</label>
                      <input type="text" value={deviceType} onChange={e => setDeviceType(e.target.value)} className="w-full form-input-futuristic" required placeholder="مثال: iPhone 13 Pro" />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">التكلفة المتوقعة</label>
                      <input type="number" value={cost} onChange={e => setCost(+e.target.value)} className="w-full form-input-futuristic" required />
                  </div>
                  <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">وصف العطل</label>
                      <textarea value={problemDescription} onChange={e => setProblemDescription(e.target.value)} className="w-full form-input-futuristic" rows={3} required></textarea>
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-[var(--text-secondary)] bg-black/20 hover:bg-white/10 transition-colors">إلغاء</button>
                  <button type="submit" className="bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-2 px-4 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300">حفظ واستلام</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
    );
};

const Maintenance: React.FC<MaintenanceProps> = ({ jobs, addJob, updateJobStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'جاري الإصلاح' | 'تم الإصلاح' | 'تم التسليم'>('جاري الإصلاح');

  const filteredJobs = useMemo(() => {
    if (filter === 'all') return jobs;
    return jobs.filter(job => job.status === filter);
  }, [jobs, filter]);

  const getStatusChip = (status: MaintenanceJob['status']) => {
    switch (status) {
        case 'جاري الإصلاح':
            return <span className="bg-yellow-500/20 text-yellow-300 text-xs font-medium px-2.5 py-0.5 rounded-full border border-yellow-500/50">جاري الإصلاح</span>;
        case 'تم الإصلاح':
            return <span className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full border border-blue-500/50">تم الإصلاح</span>;
        case 'تم التسليم':
            return <span className="bg-green-500/20 text-green-300 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-500/50">تم التسليم</span>;
    }
  }

  return (
    <div className="p-8 animate-fadeInUp">
      <PageHeader title="إدارة الصيانة">
        <div className="flex items-center gap-4 flex-wrap">
            <div className="flex rounded-md p-1 bg-black/20">
                <button onClick={() => setFilter('جاري الإصلاح')} className={`p-2 px-4 text-center font-semibold rounded-md transition-all duration-300 ${filter === 'جاري الإصلاح' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-[0_0_10px_yellow]' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}>تحت الإصلاح</button>
                <button onClick={() => setFilter('تم الإصلاح')} className={`p-2 px-4 text-center font-semibold rounded-md transition-all duration-300 ${filter === 'تم الإصلاح' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-black shadow-[0_0_10px_var(--accent-cyan)]' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}>جاهز للتسليم</button>
                <button onClick={() => setFilter('تم التسليم')} className={`p-2 px-4 text-center font-semibold rounded-md transition-all duration-300 ${filter === 'تم التسليم' ? 'bg-gradient-to-r from-green-500 to-lime-500 text-black shadow-[0_0_10px_#84cc16]' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}>الأرشيف</button>
                <button onClick={() => setFilter('all')} className={`p-2 px-4 text-center font-semibold rounded-md transition-all duration-300 ${filter === 'all' ? 'bg-gradient-to-r from-gray-500 to-gray-400 text-black shadow-[0_0_10px_gray]' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}>الكل</button>
            </div>
             <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-2 px-4 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300">
                <PlusCircleIcon className="w-5 h-5 me-2" />
                استلام جهاز جديد
            </button>
        </div>
      </PageHeader>
      
      <div className="glass-card p-6 rounded-lg overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b-2 border-[var(--accent-cyan)]">
            <tr>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">العميل</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">الهاتف</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">الجهاز</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">العطل</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">التكلفة</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">تاريخ الاستلام</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">الحالة</th>
              <th className="p-3 text-lg text-[var(--accent-cyan)]">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.slice().reverse().map(job => (
              <tr key={job.id} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                <td className="p-3 font-medium">{job.customerName}</td>
                <td className="p-3 text-[var(--text-secondary)]">{job.customerPhone}</td>
                <td className="p-3 text-[var(--text-secondary)]">{job.deviceType}</td>
                <td className="p-3 text-[var(--text-secondary)] whitespace-pre-wrap max-w-xs">{job.problemDescription}</td>
                <td className="p-3 font-semibold text-green-400">{job.cost.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                <td className="p-3 text-[var(--text-secondary)]">{new Date(job.receivedDate).toLocaleDateString('ar-EG')}</td>
                <td className="p-3">{getStatusChip(job.status)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {job.status === 'جاري الإصلاح' && (
                        <button onClick={() => updateJobStatus(job.id, 'تم الإصلاح')} className="text-sm bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-md transition-colors">تم الإصلاح</button>
                    )}
                     {job.status === 'تم الإصلاح' && (
                        <button onClick={() => window.confirm('هل أنت متأكد من تسليم الجهاز للعميل؟ سيتم إضافة التكلفة إلى الخزنة.') && updateJobStatus(job.id, 'تم التسليم')} className="text-sm bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-md transition-colors">تسليم للعميل</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && <MaintenanceModal onClose={() => setIsModalOpen(false)} onSave={addJob} />}
    </div>
  );
};

export default Maintenance;
