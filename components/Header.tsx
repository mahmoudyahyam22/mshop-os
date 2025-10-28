import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Notification, Page, Product, Customer, Sale } from '../types';
import { BellIcon, ProductIcon, InstallmentsIcon, MenuIcon, LogoutIcon, CheckCircleIcon, SearchIcon, SalesIcon, CustomerIcon } from './icons';

interface HeaderProps {
    onMenuButtonClick: () => void;
    notifications: Notification[];
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    setActivePage: (page: Page) => void;
    onLogout: () => void;
    globalSearchData: { products: Product[], customers: Customer[], sales: Sale[] };
}

// ... NotificationPanel component remains the same ...
const NotificationPanel: React.FC<{
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onNavigate: (page: Page) => void;
}> = ({ notifications, onMarkAsRead, onMarkAllAsRead, onNavigate }) => {
    
    const getIconForType = (type: Notification['type']) => {
        switch (type) {
            case 'low_stock': return <ProductIcon className="w-5 h-5 text-yellow-400" />;
            case 'installment_overdue': return <InstallmentsIcon className="w-5 h-5 text-red-400" />;
            case 'installment_upcoming': return <InstallmentsIcon className="w-5 h-5 text-blue-400" />;
            case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
            default: return <BellIcon className="w-5 h-5 text-gray-400" />;
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.linkTo) {
            onNavigate(notification.linkTo);
        }
    };

    const sortedNotifications = [...notifications].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="absolute top-full left-0 mt-2 w-80 glass-card rounded-lg shadow-xl border z-50 animate-fadeInUp" style={{animationDuration: '0.2s'}}>
            <div className="p-3 flex justify-between items-center border-b border-[var(--border-glow)]">
                <h4 className="font-bold text-[var(--text-primary)]">الإشعارات</h4>
                <button onClick={onMarkAllAsRead} className="text-sm text-blue-400 hover:underline">
                    تحديد الكل كمقروء
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {sortedNotifications.length === 0 ? (
                    <p className="text-center text-[var(--text-secondary)] py-6">لا توجد إشعارات.</p>
                ) : (
                    sortedNotifications.map(n => (
                        <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 flex items-start gap-3 border-b border-white/10 hover:bg-white/10 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-500/10' : ''}`}
                        >
                            <div className="flex-shrink-0 mt-1">{getIconForType(n.type)}</div>
                            <div>
                                <p className="text-sm text-[var(--text-primary)]">{n.message}</p>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    {new Date(n.timestamp).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                            </div>
                            {!n.isRead && <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full ms-auto mt-2 animate-pulse"></div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const GlobalSearch: React.FC<{
    searchData: HeaderProps['globalSearchData'],
    onNavigate: (page: Page) => void
}> = ({ searchData, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ type: string; item: any; }[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }
        const lowerCaseQuery = query.toLowerCase();
        const productResults = searchData.products
            .filter(p => p.name.toLowerCase().includes(lowerCaseQuery) || p.barcode?.includes(lowerCaseQuery))
            .map(item => ({ type: 'product', item }));
        
        const customerResults = searchData.customers
            .filter(c => c.name.toLowerCase().includes(lowerCaseQuery) || c.phone.includes(lowerCaseQuery))
            .map(item => ({ type: 'customer', item }));

        const saleResults = searchData.sales
            .filter(s => s.id.includes(lowerCaseQuery))
            .map(item => ({ type: 'sale', item }));

        setResults([...productResults, ...customerResults, ...saleResults].slice(0, 10));

    }, [query, searchData]);
    
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setQuery('');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleResultClick = (result: { type: string; item: any; }) => {
        switch(result.type) {
            case 'product': onNavigate('products'); break;
            case 'customer': onNavigate('customers'); break;
            case 'sale': onNavigate('sales'); break;
        }
        setQuery('');
    };
    
    const getResultIcon = (type: string) => {
        if(type === 'product') return <ProductIcon className="w-5 h-5 text-green-400"/>;
        if(type === 'customer') return <CustomerIcon className="w-5 h-5 text-purple-400"/>;
        if(type === 'sale') return <SalesIcon className="w-5 h-5 text-blue-400"/>;
        return null;
    }

    return (
        <div className="relative" ref={searchRef}>
            <div className="relative">
                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]"/>
                <input 
                    type="search"
                    placeholder="بحث سريع..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="form-input-futuristic w-48 md:w-64 !border-2 !rounded-lg pr-10"
                />
            </div>
            {results.length > 0 && (
                 <div className="absolute top-full mt-2 w-full glass-card rounded-lg shadow-xl border z-50 animate-fadeInUp max-h-96 overflow-y-auto" style={{animationDuration: '0.2s'}}>
                     {results.map((r, i) => (
                        <div key={`${r.type}-${r.item.id}-${i}`} onClick={() => handleResultClick(r)} className="p-3 flex items-center gap-3 border-b border-white/10 hover:bg-white/10 cursor-pointer">
                            {getResultIcon(r.type)}
                            <div>
                               <p className="text-sm font-semibold text-[var(--text-primary)]">{r.type === 'sale' ? `فاتورة #${r.item.id.substring(1)}` : r.item.name}</p>
                               <p className="text-xs text-[var(--text-secondary)]">{r.type === 'customer' ? r.item.phone : r.type === 'sale' ? new Date(r.item.date).toLocaleDateString() : `متاح: ${r.item.stock}`}</p>
                            </div>
                        </div>
                     ))}
                 </div>
            )}
        </div>
    );
}


const Header: React.FC<HeaderProps> = ({ onMenuButtonClick, notifications, markAsRead, markAllAsRead, setActivePage, onLogout, globalSearchData }) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsPanelOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [panelRef]);


    return (
        <header className="sticky top-0 glass-card p-4 flex justify-between items-center z-30 flex-shrink-0 no-print">
             <div className="flex items-center gap-4">
                <button onClick={onMenuButtonClick} className="lg:hidden text-[var(--text-secondary)] hover:text-white">
                    <MenuIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-[var(--text-primary)] hidden sm:block">لوحة التحكم</h1>
            </div>
            <div className="flex items-center gap-4">
                 <GlobalSearch searchData={globalSearchData} onNavigate={setActivePage} />

                <button onClick={onLogout} title="تسجيل الخروج" className="relative p-2 rounded-full hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors">
                    <LogoutIcon className="w-6 h-6"/>
                </button>
                <div className="relative" ref={panelRef}>
                    <button onClick={() => setIsPanelOpen(prev => !prev)} className="relative p-2 rounded-full hover:bg-white/10">
                        <BellIcon className="w-6 h-6 text-[var(--text-secondary)]" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center border-2 border-white/50 animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {isPanelOpen && (
                        <NotificationPanel 
                            notifications={notifications}
                            onMarkAsRead={markAsRead}
                            onMarkAllAsRead={() => {
                                markAllAsRead();
                                setIsPanelOpen(false);
                            }}
                            onNavigate={(page) => {
                                setActivePage(page);
                                setIsPanelOpen(false);
                            }}
                        />
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;