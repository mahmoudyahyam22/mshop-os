

import React, { useState, useMemo, useEffect } from 'react';
import type { Customer, Product, Sale, InstallmentPlan, SaleItem, ProductInstance, StoreInfo, InstallmentPlanCreationData } from '../types';
import PageHeader from '../components/PageHeader';
import { PlusCircleIcon, TrashIcon, BarcodeIcon, CheckCircleIcon, PrintIcon } from '../components/icons';
import Portal from '../components/Portal';
import Invoice from '../components/Invoice';

type NewCustomerData = Omit<Customer, 'id'>;

interface SaleSuccessModalProps {
    sale: Sale;
    onNewSale: () => void;
    onPrint: () => void;
}

const SaleSuccessModal: React.FC<SaleSuccessModalProps> = ({ sale, onNewSale, onPrint }) => {
    return (
        <Portal>
            <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[70]">
                <div className="glass-card p-8 rounded-lg w-full max-w-md text-center animate-modal-pop-in">
                    <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-400" />
                    <h2 className="text-2xl font-bold text-center text-[var(--accent-cyan)] mb-2">تمت عملية البيع بنجاح!</h2>
                    <p className="text-[var(--text-secondary)] mb-8">فاتورة رقم #{sale.id.substring(5)}</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={onNewSale} className="py-3 px-6 rounded-md text-[var(--text-secondary)] bg-black/20 hover:bg-white/10 transition-colors font-semibold">
                            فاتورة جديدة
                        </button>
                        <button onClick={onPrint} className="flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold rounded-md shadow-lg hover:shadow-[0_0_15px_var(--accent-cyan)] transition-shadow">
                            <PrintIcon className="w-5 h-5"/>
                            طباعة الفاتورة
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}


interface SalesProps {
  customers: Customer[];
  products: Product[];
  productInstances: ProductInstance[];
  storeInfo: StoreInfo;
  createSale: (
    saleData: Omit<Sale, 'id' | 'date' | 'customerId'> & { customerId?: string }, 
    installmentData?: InstallmentPlanCreationData,
    newCustomerData?: NewCustomerData
  ) => Promise<Sale | null>; // Return the created sale
}

const Sales: React.FC<SalesProps> = ({ customers, products, productInstances, storeInfo, createSale }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [serialNumber, setSerialNumber] = useState('');
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash');
  const [barcode, setBarcode] = useState('');
  
  const [saleCustomerType, setSaleCustomerType] = useState<'cash' | 'existing' | 'new'>('cash');
  const [newCustomer, setNewCustomer] = useState<NewCustomerData>({ name: '', phone: '', address: '', nationalId: '' });
  
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);

  // Installment state...
  const [downPayment, setDownPayment] = useState<number>(0);
  const [numberOfMonths, setNumberOfMonths] = useState<number>(12);
  const [interestRate, setInterestRate] = useState<number>(15); 
  const [monthlyDueDate, setMonthlyDueDate] = useState<number>(15);
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorAddress, setGuarantorAddress] = useState('');
  const [guarantorNationalId, setGuarantorNationalId] = useState('');


  const {cartTotal, totalCost} = useMemo(() => {
    return cart.reduce((acc, item) => {
        acc.cartTotal += item.unitPrice * item.quantity;
        acc.totalCost += (item.unitPurchasePrice || 0) * item.quantity;
        return acc;
    }, {cartTotal: 0, totalCost: 0});
  }, [cart]);

  const { interestAmount, totalWithInterest, remainingAmount, monthlyInstallment } = useMemo(() => {
    if (paymentType === 'installment') {
        const principal = cartTotal;
        const interest = (principal - downPayment) * (interestRate / 100);
        const totalPayable = principal + interest;
        const remaining = totalPayable - downPayment;
        const monthly = numberOfMonths > 0 ? remaining / numberOfMonths : 0;
        return { interestAmount: interest, totalWithInterest: totalPayable, remainingAmount: remaining, monthlyInstallment: monthly };
    }
    return { interestAmount: 0, totalWithInterest: cartTotal, remainingAmount: 0, monthlyInstallment: 0 };
  }, [cartTotal, paymentType, downPayment, numberOfMonths, interestRate]);

  const cashProfit = cartTotal - totalCost;

  const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);

  useEffect(() => {
    if (selectedProduct) { setItemPrice(selectedProduct.sellingPrice); } 
    else { setItemPrice(0); }
  }, [selectedProduct]);

  useEffect(() => {
    if (saleCustomerType === 'cash') {
        setPaymentType('cash');
    }
  }, [saleCustomerType]);

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      alert('الفاتورة فارغة.');
      return;
    }

    let customerId: string | undefined = undefined;
    let customerData: NewCustomerData | undefined = undefined;

    if (saleCustomerType === 'existing') {
        if (!selectedCustomerId) {
            alert('يرجى اختيار عميل حالي.');
            return;
        }
        customerId = selectedCustomerId;
    } else if (saleCustomerType === 'new') {
        if (!newCustomer.name || !newCustomer.phone || !newCustomer.nationalId) {
            alert('يرجى ملء بيانات العميل الجديد (الاسم، الهاتف، الرقم القومي).');
            return;
        }
        customerData = newCustomer;
    }

    if (paymentType === 'installment' && saleCustomerType === 'cash') {
        alert('لا يمكن بيع التقسيط لعميل نقدي. يرجى اختيار عميل حالي أو إضافة عميل جديد.');
        return;
    }
    
    const saleData: Omit<Sale, 'id' | 'date' | 'customerId'> & { customerId?: string } = {
        items: cart,
        totalAmount: cartTotal,
        profit: cashProfit, // Profit calculation should be refined in the backend function
        paymentType,
        customerId: customerId,
    };
    
    const installmentData = paymentType === 'installment' ? {
        downPayment,
        numberOfMonths,
        interestRate,
        monthlyDueDate,
        guarantorName,
        guarantorPhone,
        guarantorAddress,
        guarantorNationalId,
    } : undefined;
    
    try {
        const createdSale = await createSale(saleData, installmentData, customerData);
        if (createdSale) {
            setLastSale(createdSale);
        }
    } catch (error: any) {
        alert(`فشلت عملية البيع: ${error.message}`);
    }
  };

  const resetForNewSale = () => {
    setLastSale(null);
    setSelectedCustomerId(''); setCart([]); setPaymentType('cash'); setSaleCustomerType('cash');
    setNewCustomer({ name: '', phone: '', address: '', nationalId: '' });
    // Reset installment form...
    setDownPayment(0);
    setNumberOfMonths(12);
    setInterestRate(15);
    setGuarantorName('');
    setGuarantorPhone('');
    setGuarantorAddress('');
    setGuarantorNationalId('');
    setShowPrintView(false);
  };
  
  const addProductToCart = () => {
    if (!selectedProduct) return;

    if (selectedProduct.isSerialized) {
        if (!serialNumber) { alert("يرجى إدخال الرقم التسلسلي."); return; }
        const instance = productInstances.find(i => i.productId === selectedProduct.id && i.serialNumber === serialNumber && i.status === 'in_stock');
        if (!instance) { alert("الرقم التسلسلي غير صحيح أو المنتج غير متوفر."); return; }
        if (cart.some(item => item.serialNumber === serialNumber)) { alert("هذا الرقم التسلسلي موجود بالفعل في الفاتورة."); return; }
        
        const cartItem: SaleItem = {
            productId: selectedProduct.id,
            quantity: 1,
            unitPrice: itemPrice,
            unitPurchasePrice: selectedProduct.purchasePrice,
            serialNumber: serialNumber,
        };
        setCart(prev => [...prev, cartItem]);
        setSerialNumber('');

    } else {
        if (quantity <= 0) { alert("يرجى إدخال كمية صحيحة."); return; }
        if (quantity > selectedProduct.stock) { alert(`الكمية المطلوبة غير متوفرة. المتاح: ${selectedProduct.stock}`); return; }
        
        const existingItem = cart.find(item => item.productId === selectedProduct.id);
        if (existingItem) {
            // Update quantity of existing item
            setCart(prev => prev.map(item =>
                item.productId === selectedProduct.id ? { ...item, quantity: item.quantity + quantity, unitPrice: itemPrice } : item
            ));
        } else {
             const cartItem: SaleItem = {
                productId: selectedProduct.id,
                quantity: quantity,
                unitPrice: itemPrice,
                unitPurchasePrice: selectedProduct.purchasePrice,
            };
            setCart(prev => [...prev, cartItem]);
        }
    }
     // Reset fields after adding
    setSelectedProductId('');
    setQuantity(1);
    setItemPrice(0);
  };

  const removeFromCart = (productId: string, serial?: string) => {
    setCart(prev => prev.filter(item => !(item.productId === productId && item.serialNumber === serial)));
  };
  
  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcode) {
        e.preventDefault();
        const product = products.find(p => p.barcode === barcode);
        if (product) {
            setSelectedProductId(product.id);
        } else {
            alert('لم يتم العثور على منتج بهذا الباركود.');
        }
        setBarcode('');
    }
  };

  return (
    <div className="p-8 animate-fadeInUp">
      <PageHeader title="فاتورة بيع جديدة" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 glass-card p-6 rounded-lg">
           <h3 className="text-xl font-bold mb-4">1. تحديد العميل</h3>
           <div className="flex gap-4 mb-6 bg-black/20 p-3 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="customerType" checked={saleCustomerType === 'cash'} onChange={() => setSaleCustomerType('cash')} className="accent-[var(--accent-cyan)]" /> عميل نقدي</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="customerType" checked={saleCustomerType === 'existing'} onChange={() => setSaleCustomerType('existing')} className="accent-[var(--accent-cyan)]"/> عميل حالي</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="customerType" checked={saleCustomerType === 'new'} onChange={() => setSaleCustomerType('new')} className="accent-[var(--accent-cyan)]"/> عميل جديد</label>
           </div>
           
           {saleCustomerType === 'existing' && (
                <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="w-full form-input-futuristic mb-6">
                    <option value="">-- اختر عميل --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                </select>
           )}
           {saleCustomerType === 'new' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <input type="text" placeholder="اسم العميل" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="form-input-futuristic" />
                    <input type="tel" placeholder="رقم الهاتف" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="form-input-futuristic" />
                    <input type="text" placeholder="الرقم القومي" value={newCustomer.nationalId} onChange={e => setNewCustomer({...newCustomer, nationalId: e.target.value})} className="form-input-futuristic md:col-span-2" />
                    <input type="text" placeholder="العنوان (اختياري)" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="form-input-futuristic md:col-span-2" />
                </div>
           )}
            
            <h3 className="text-xl font-bold mb-4 mt-8">2. إضافة المنتجات</h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end mb-6">
                 <div className="sm:col-span-2">
                    <label className="text-xs text-[var(--text-secondary)]">المنتج</label>
                    <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="w-full form-input-futuristic">
                        <option value="">-- اختر منتج --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
                 {selectedProduct?.isSerialized ? (
                     <div className="sm:col-span-2">
                         <label className="text-xs text-[var(--text-secondary)]">الرقم التسلسلي</label>
                         <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className="w-full form-input-futuristic" />
                     </div>
                 ) : (
                    <div>
                        <label className="text-xs text-[var(--text-secondary)]">الكمية</label>
                        <input type="number" value={quantity} onChange={e => setQuantity(+e.target.value)} className="w-full form-input-futuristic" min="1"/>
                    </div>
                 )}
                
                 <div>
                    <label className="text-xs text-[var(--text-secondary)]">السعر</label>
                    <input type="number" value={itemPrice} onChange={e => setItemPrice(+e.target.value)} className="w-full form-input-futuristic" />
                 </div>
                 <button onClick={addProductToCart} className="bg-green-500/80 text-white font-bold h-10 rounded-md shadow-lg hover:bg-green-500 transition-all flex items-center justify-center gap-2">
                    <PlusCircleIcon className="w-5 h-5"/> إضافة
                </button>
            </div>
             <div className="relative mb-6">
                <BarcodeIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="أو امسح الباركود هنا" value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={handleBarcodeScan} className="w-full form-input-futuristic pr-10" />
            </div>

            <div className="min-h-[150px] bg-black/20 p-4 rounded-lg">
                <h4 className="font-bold mb-2">محتويات الفاتورة:</h4>
                <div className="max-h-60 overflow-y-auto">
                    {cart.length === 0 ? <p className="text-center text-gray-400 py-4">الفاتورة فارغة</p> : cart.map(item => {
                         const product = products.find(p => p.id === item.productId);
                         return (
                            <div key={item.productId + (item.serialNumber || '')} className="flex justify-between items-center p-2 border-b border-white/10">
                                <div>
                                    <p className="font-semibold">{product?.name} {item.serialNumber ? `(${item.serialNumber})` : `(x${item.quantity})`}</p>
                                    <p className="text-sm text-gray-400">{(item.unitPrice * item.quantity).toLocaleString('ar-EG')} ج.م</p>
                                </div>
                                <button onClick={() => removeFromCart(item.productId, item.serialNumber)} className="text-red-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                         )
                    })}
                </div>
            </div>
        </div>

        <div className="glass-card p-6 rounded-lg h-fit">
            <h3 className="text-xl font-bold mb-4">3. الدفع والملخص</h3>
            <div className="flex gap-4 mb-6">
                <button onClick={() => setPaymentType('cash')} className={`w-1/2 p-3 rounded-lg font-semibold transition-all ${paymentType === 'cash' ? 'bg-cyan-400 text-black shadow-[0_0_10px_var(--accent-cyan)]' : 'bg-black/20'}`}>
                    نقدي
                </button>
                <button onClick={() => setPaymentType('installment')} className={`w-1/2 p-3 rounded-lg font-semibold transition-all ${paymentType === 'installment' ? 'bg-purple-400 text-black shadow-[0_0_10px_var(--accent-purple)]' : 'bg-black/20'}`} disabled={saleCustomerType === 'cash'}>
                    تقسيط
                </button>
            </div>

            {paymentType === 'installment' && (
                <div className="space-y-3 mb-6 animate-fadeInUp" style={{animationDuration: '0.3s'}}>
                    <h4 className="font-semibold">تفاصيل التقسيط:</h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                         <div>
                            <label className="block text-xs text-[var(--text-secondary)] mb-1">المقدم</label>
                            <input type="number" value={downPayment} onChange={e => setDownPayment(+e.target.value)} className="form-input-futuristic w-full text-center"/>
                         </div>
                         <div>
                            <label className="block text-xs text-[var(--text-secondary)] mb-1">عدد الشهور</label>
                            <input type="number" value={numberOfMonths} onChange={e => setNumberOfMonths(+e.target.value)} className="form-input-futuristic w-full text-center"/>
                         </div>
                         <div>
                            <label className="block text-xs text-[var(--text-secondary)] mb-1">نسبة الفائدة %</label>
                            <input type="number" value={interestRate} onChange={e => setInterestRate(+e.target.value)} className="form-input-futuristic w-full text-center"/>
                         </div>
                    </div>
                     <div>
                         <label className="block text-xs text-[var(--text-secondary)] mb-1">يوم الاستحقاق الشهري</label>
                         <input type="number" value={monthlyDueDate} onChange={e => setMonthlyDueDate(Math.max(1, Math.min(31, +e.target.value)))} className="form-input-futuristic w-full"/>
                    </div>
                    <h4 className="font-semibold pt-2">بيانات الضامن:</h4>
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-[var(--text-secondary)] mb-1">اسم الضامن</label>
                            <input type="text" value={guarantorName} onChange={e => setGuarantorName(e.target.value)} className="form-input-futuristic"/>
                        </div>
                        <div>
                            <label className="block text-xs text-[var(--text-secondary)] mb-1">هاتف الضامن</label>
                            <input type="tel" value={guarantorPhone} onChange={e => setGuarantorPhone(e.target.value)} className="form-input-futuristic"/>
                        </div>
                     </div>
                     <div>
                         <label className="block text-xs text-[var(--text-secondary)] mb-1">الرقم القومي للضامن</label>
                         <input type="text" value={guarantorNationalId} onChange={e => setGuarantorNationalId(e.target.value)} className="form-input-futuristic w-full"/>
                     </div>
                     <div>
                         <label className="block text-xs text-[var(--text-secondary)] mb-1">عنوان الضامن</label>
                         <input type="text" value={guarantorAddress} onChange={e => setGuarantorAddress(e.target.value)} className="form-input-futuristic w-full"/>
                     </div>
                </div>
            )}
            
            <div className="border-t border-[var(--border-glow)] pt-4 space-y-2">
                 <div className="flex justify-between"><span>الإجمالي:</span><span className="font-semibold">{cartTotal.toLocaleString('ar-EG')} ج.م</span></div>
                 {paymentType === 'installment' && (
                    <>
                        <div className="flex justify-between text-sm"><span>المقدم:</span><span className="font-semibold">{downPayment.toLocaleString('ar-EG')} ج.م</span></div>
                        <div className="flex justify-between text-sm"><span>قيمة الفائدة:</span><span className="font-semibold">{interestAmount.toLocaleString('ar-EG')} ج.م</span></div>
                        <div className="flex justify-between text-sm"><span>إجمالي بالفوائد:</span><span className="font-semibold">{totalWithInterest.toLocaleString('ar-EG')} ج.م</span></div>
                        <div className="flex justify-between text-sm"><span>المبلغ المتبقي:</span><span className="font-semibold text-yellow-400">{remainingAmount.toLocaleString('ar-EG')} ج.م</span></div>
                        <div className="flex justify-between text-sm"><span>القسط الشهري:</span><span className="font-semibold text-cyan-300">{monthlyInstallment.toLocaleString('ar-EG')} ج.م</span></div>
                    </>
                 )}
                 <div className="flex justify-between font-bold text-2xl pt-2">
                    <span>الإجمالي المطلوب:</span>
                    <span className="text-[var(--accent-cyan)]">{paymentType === 'cash' ? cartTotal.toLocaleString('ar-EG') : downPayment.toLocaleString('ar-EG')} ج.م</span>
                </div>
            </div>

            <button onClick={handleCreateSale} disabled={cart.length === 0} className="w-full mt-6 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-black font-bold py-3 rounded-md shadow-lg hover:shadow-[0_0_20px_var(--accent-cyan)] transition-shadow duration-300 disabled:from-gray-500 disabled:to-gray-600 disabled:shadow-none disabled:text-gray-400">
                إتمام البيع
            </button>
        </div>
      </div>
      
      {lastSale && !showPrintView && (
          <SaleSuccessModal 
              sale={lastSale}
              onNewSale={resetForNewSale}
              onPrint={() => setShowPrintView(true)}
          />
      )}
      {lastSale && showPrintView && (
          <Invoice 
              sale={lastSale}
              customer={customers.find(c => c.id === lastSale.customerId) || null}
              storeInfo={storeInfo}
              products={products}
              onClose={resetForNewSale}
          />
      )}
    </div>
  );
};

export default Sales;