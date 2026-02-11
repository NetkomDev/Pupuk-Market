import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, createContext } from 'react';
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

function App() {
    const cart = useCart();
    const [toasts, setToasts] = useState([]);

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
            </ToastContext.Provider>
        </CartContext.Provider>
    );
}

export default App;
