import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect, createContext } from 'react';
import { supabase } from './lib/supabase';
import { useCart } from './hooks/useCart';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import './index.css';

export const CartContext = createContext();
export const ToastContext = createContext();
export const SettingsContext = createContext();

function App() {
    const cart = useCart();
    const [toasts, setToasts] = useState([]);
    const [settings, setSettings] = useState({
        store_name: 'Pupuk Marketplace',
        phone: '081234567890',
        whatsapp_number: '6281234567890',
        address: 'Jl. Raya Pertanian No. 1, Indonesia',
        email: 'info@pupukmarket.id',
        instagram_url: '',
        facebook_url: '',
        youtube_url: '',
        tiktok_url: '',
        shopee_url: '',
        tokopedia_url: ''
    });

    useEffect(() => {
        // Fetch store settings
        const fetchSettings = async () => {
            const { data, error } = await supabase.from('pupuk_store_settings').select('*').single();
            if (data && !error) {
                setSettings(data);
            }
        };
        fetchSettings();
    }, []);

    const addToast = (message, icon = '✓') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, icon }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    return (
        <CartContext.Provider value={cart}>
            <ToastContext.Provider value={addToast}>
                <SettingsContext.Provider value={{ settings, setSettings }}>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/product/:slug" element={<ProductDetail />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/order-success" element={<OrderSuccess />} />
                            <Route path="/admin" element={<AdminLogin />} />
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        </Routes>
                    </BrowserRouter>

                    {/* Toast notifications */}
                    <div className="toast-container">
                        {toasts.map(t => (
                            <div key={t.id} className="toast">
                                <span className="toast-icon">{t.icon}</span>
                                {t.message}
                            </div>
                        ))}
                    </div>
                </SettingsContext.Provider>
            </ToastContext.Provider>
        </CartContext.Provider>
    );
}

export default App;
