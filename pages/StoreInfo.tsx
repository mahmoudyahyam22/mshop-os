import React, { useState, useEffect } from 'react';
import type { StoreInfo } from '../types';
import PageHeader from '../components/PageHeader';
import { EditIcon } from '../components/icons';

interface StoreInfoProps {
  storeInfo: StoreInfo;
  onUpdate: (newInfo: StoreInfo) => void;
}

const StoreInfoPage: React.FC<StoreInfoProps> = ({ storeInfo, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<StoreInfo>(storeInfo);

  useEffect(() => {
    setFormData(storeInfo);
  }, [storeInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(storeInfo);
    setIsEditing(false);
  };

  const renderField = (label: string, name: keyof StoreInfo, value: string) => (
    <div className="p-4 bg-black/10 rounded-lg">
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        disabled={!isEditing}
        className="w-full form-input-futuristic disabled:border-transparent disabled:text-[var(--text-primary)] disabled:font-semibold disabled:text-lg"
      />
    </div>
  );

  return (
    <div className="p-8 animate-fadeInUp">
      <PageHeader title="بيانات المتجر">
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-2 px-4 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-purple)] transition-shadow duration-300"
          >
            <EditIcon className="w-5 h-5 me-2" />
            تعديل البيانات
          </button>
        )}
      </PageHeader>

      <form onSubmit={handleSave}>
        <div className="glass-card p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('اسم المتجر', 'storeName', formData.storeName)}
            {renderField('اسم المالك', 'ownerName', formData.ownerName)}
            {renderField('رقم الهاتف', 'phone', formData.phone)}
            {renderField('العنوان', 'address', formData.address)}
            {renderField('رقم السجل التجاري', 'commercialRecord', formData.commercialRecord)}
            {renderField('رقم البطاقة الضريبية', 'taxCardNumber', formData.taxCardNumber)}
          </div>

          {isEditing && (
            <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-[var(--border-glow)]">
              <button
                type="button"
                onClick={handleCancel}
                className="py-2 px-6 rounded-md text-[var(--text-secondary)] bg-black/20 hover:bg-white/10 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-2 px-6 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300"
              >
                حفظ التغييرات
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default StoreInfoPage;
