import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../App';
import { SUPABASE_URL } from '../lib/supabase';

function formatPrice(price) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(price);
}

export default function CartDrawer({ isOpen, onClose }) {
    const { items, updateQuantity, removeItem, totalAmount } = useContext(CartContext);
    const navigate = useNavigate();

    const handleCheckout = () => {
        onClose();
        navigate('/checkout');
    };

    const getImageUrl = (url) => {
        if (!url) return 'https://placehold.co/100x100/E8F5E9/1B5E20?text=🌿';
        return url.startsWith('http') || url.startsWith('/') ? url : `${SUPABASE_URL}/storage/v1/object/public/pupuk-images/${url}`;
    };

    return (
        <>
            <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
                <div className="cart-drawer-header">
                    <h3>Keranjang ({items.length})</h3>
                    <button className="cart-drawer-close" onClick={onClose}>✕</button>
                </div>

                <div className="cart-drawer-body">
                    {items.length === 0 ? (
                        <div className="cart-empty">
                            <div className="empty-icon">🛒</div>
                            <p>Keranjang masih kosong</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="cart-item">
                                <div className="cart-item-image">
                                    <img src={getImageUrl(item.image_url)} alt={item.name} />
                                </div>
                                <div className="cart-item-info">
                                    <div className="cart-item-name">{item.name}</div>
                                    <div className="cart-item-price">{formatPrice(item.selling_price)}</div>
                                    <div className="cart-item-controls">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                    </div>
                                </div>
                                <button className="cart-item-remove" onClick={() => removeItem(item.id)}>
                                    🗑
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="cart-drawer-footer">
                        <div className="cart-total">
                            <span className="cart-total-label">Total</span>
                            <span className="cart-total-amount">{formatPrice(totalAmount)}</span>
                        </div>
                        <button className="btn-primary" onClick={handleCheckout} style={{ width: '100%' }}>
                            Checkout Sekarang
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
