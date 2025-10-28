import React, { useEffect } from 'react';
import type { Sale, Customer, StoreInfo, Product } from '../types';

interface InvoiceProps {
  sale: Sale;
  customer: Customer | null;
  storeInfo: StoreInfo;
  products: Product[];
  onClose: () => void;
}

const Invoice: React.FC<InvoiceProps> = ({ sale, customer, storeInfo, products, onClose }) => {

    useEffect(() => {
        // Trigger print dialog automatically when component mounts
        window.print();
    }, []);

  return (
    <div className="fixed inset-0 bg-gray-100 z-[100] p-4 sm:p-8 overflow-y-auto no-print">
       <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-2xl printable-invoice">
        <div className="flex justify-end mb-8 no-print">
            <button onClick={onClose} className="text-gray-500 hover:text-black">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
        </div>
        
        {/* Header */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">{storeInfo.storeName}</h1>
                <p className="text-sm text-gray-500">{storeInfo.address}</p>
                <p className="text-sm text-gray-500">هاتف: {storeInfo.phone}</p>
            </div>
            <div className="text-right">
                <h2 className="text-4xl font-bold text-cyan-600">فاتورة بيع</h2>
                <p className="text-gray-500">رقم الفاتورة: #{sale.id.substring(5)}</p>
                <p className="text-gray-500">التاريخ: {new Date(sale.date).toLocaleDateString('ar-EG')}</p>
            </div>
        </div>

        {/* Customer Info */}
        <div className="flex justify-between items-center py-6">
            <div>
                <h3 className="font-semibold text-gray-600 mb-1">فاتورة إلى:</h3>
                <p className="font-bold text-lg text-gray-800">{customer ? customer.name : 'عميل نقدي'}</p>
                {customer && <p className="text-gray-500">{customer.address}</p>}
                {customer && <p className="text-gray-500">{customer.phone}</p>}
            </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                        <th className="p-3 font-semibold text-gray-600">#</th>
                        <th className="p-3 font-semibold text-gray-600">المنتج</th>
                        <th className="p-3 font-semibold text-gray-600">الرقم التسلسلي</th>
                        <th className="p-3 font-semibold text-gray-600">الكمية</th>
                        <th className="p-3 font-semibold text-gray-600">سعر الوحدة</th>
                        <th className="p-3 font-semibold text-gray-600 text-left">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, index) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                             <tr key={index} className="border-b border-gray-200">
                                <td className="p-3">{index + 1}</td>
                                <td className="p-3 font-medium text-gray-800">{product?.name || 'منتج غير معروف'}</td>
                                <td className="p-3 text-gray-500">{item.serialNumber || '-'}</td>
                                <td className="p-3 text-gray-500">{item.quantity}</td>
                                <td className="p-3 text-gray-500">{item.unitPrice.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                                <td className="p-3 text-left font-semibold text-gray-700">{(item.unitPrice * item.quantity).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-8">
            <div className="w-full max-w-sm">
                <div className="flex justify-between py-2">
                    <span className="text-gray-600">الإجمالي الفرعي:</span>
                    <span className="text-gray-800">{sale.totalAmount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-gray-300">
                    <span className="font-bold text-xl text-gray-800">المبلغ الإجمالي:</span>
                    <span className="font-bold text-xl text-cyan-600">{sale.totalAmount.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</span>
                </div>
            </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-200 text-center">
            <p className="text-sm text-gray-500">شكراً لتعاملكم معنا!</p>
            {sale.paymentType === 'installment' && <p className="text-xs text-gray-400 mt-2">فاتورة تقسيط - يرجى الالتزام بمواعيد السداد</p>}
        </div>

       </div>
    </div>
  );
};

export default Invoice;