import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import { CartContext, ToastContext } from '../App';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import AddressForm from '../components/AddressForm';

function formatPrice(price) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(price);
}

const CUSTOMER_CACHE_KEY = 'pupuk_customer_cache';

export default function Checkout() {
    const { items, totalAmount, clearCart } = useContext(CartContext);
    const addToast = useContext(ToastContext);
    const navigate = useNavigate();
    const [cartOpen, setCartOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [addressDetail, setAddressDetail] = useState('');
    const [notes, setNotes] = useState('');
    const [address, setAddress] = useState({
        province: '',
        kabupaten: '',
        kecamatan: '',
        kelurahan: '',
    });

    // Restore cached customer info
    useEffect(() => {
        try {
            const cached = JSON.parse(localStorage.getItem(CUSTOMER_CACHE_KEY));
            if (cached) {
                setCustomerName(cached.name || '');
                setCustomerPhone(cached.phone || '');
                setAddressDetail(cached.addressDetail || '');
            }
        } catch { }
    }, []);

    // Save customer info on change
    useEffect(() => {
        localStorage.setItem(CUSTOMER_CACHE_KEY, JSON.stringify({
            name: customerName,
            phone: customerPhone,
            addressDetail,
        }));
    }, [customerName, customerPhone, addressDetail]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!customerName.trim() || !customerPhone.trim()) {
            addToast('Lengkapi nama dan nomor HP', '⚠️');
            return;
        }
        if (!address.province || !address.kabupaten || !address.kecamatan || !address.kelurahan) {
            addToast('Lengkapi alamat pengiriman', '⚠️');
            return;
        }
        if (items.length === 0) {
            addToast('Keranjang kosong', '⚠️');
            return;
        }

        setSubmitting(true);
        try {
            // Create order
            const { data: order, error: orderError } = await supabase
                .from('pupuk_orders')
                .insert({
                    customer_name: customerName.trim(),
                    customer_phone: customerPhone.trim(),
                    shipping_province: address.province,
                    shipping_kabupaten: address.kabupaten,
                    shipping_kecamatan: address.kecamatan,
                    shipping_kelurahan: address.kelurahan,
                    shipping_address_detail: addressDetail.trim(),
                    total_amount: totalAmount,
                    notes: notes.trim(),
                    status: 'baru',
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Create order items
            const orderItems = items.map(item => ({
                order_id: order.id,
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                unit_price: item.selling_price,
                subtotal: item.selling_price * item.quantity,
            }));

            const { error: itemsError } = await supabase
                .from('pupuk_order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            clearCart();
            addToast('Pesanan berhasil dibuat!', '✅');
            navigate('/order-success', {
                state: {
                    customerName,
                    items,
                    autoRedirect: true
                }
            });
        } catch (err) {
            console.error(err);
            addToast('Gagal membuat pesanan. Coba lagi.', '❌');
        }
        setSubmitting(false);
    };

    const getImageUrl = (url) => {
        if (!url) return 'https://placehold.co/100x100/E8F5E9/1B5E20?text=🌿';
        return url.startsWith('http') || url.startsWith('/') ? url : `${SUPABASE_URL}/storage/v1/object/public/pupuk-images/${url}`;
    };

    if (items.length === 0) {
        return (
            <>
                <Navbar onCartOpen={() => setCartOpen(true)} />
                <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
                <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="empty-icon">🛒</div>
                    <h3>Keranjang Kosong</h3>
                    <p>Tambahkan produk ke keranjang terlebih dahulu</p>
                    <Link to="/" className="btn-primary" style={{ marginTop: '20px', width: 'auto' }}>
                        ← Belanja Sekarang
                    </Link>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar onCartOpen={() => setCartOpen(true)} />
            <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

            <div className="checkout-page">
                <h1>Checkout</h1>
                <p className="checkout-subtitle">Lengkapi data pengiriman untuk menyelesaikan pesanan Anda</p>

                <form className="checkout-grid" onSubmit={handleSubmit}>
                    <div>
                        {/* Customer Info */}
                        <div className="form-section" style={{ marginBottom: '20px' }}>
                            <div className="form-section-title">
                                <span className="section-icon">👤</span>
                                Data Pemesan
                            </div>
                            <div className="form-group">
                                <label>Nama Lengkap <span className="required">*</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Masukkan nama lengkap"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Nomor HP/WhatsApp <span className="required">*</span></label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="Contoh: 08123456789"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="form-section">
                            <div className="form-section-title">
                                <span className="section-icon">📍</span>
                                Alamat Pengiriman
                            </div>
                            <AddressForm value={address} onChange={setAddress} />
                            <div className="form-group">
                                <label>Detail Alamat (Jalan, RT/RW, Patokan)</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="Contoh: Jl. Raya No. 10, RT 01/RW 02, dekat Masjid"
                                    value={addressDetail}
                                    onChange={e => setAddressDetail(e.target.value)}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Catatan (Opsional)</label>
                                <textarea
                                    className="form-input"
                                    rows="2"
                                    placeholder="Catatan tambahan untuk pesanan"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <div className="order-summary">
                            <h3>Ringkasan Pesanan</h3>
                            {items.map(item => (
                                <div key={item.id} className="order-summary-item">
                                    <div className="order-summary-item-image">
                                        <img src={getImageUrl(item.image_url)} alt={item.name} />
                                    </div>
                                    <div className="order-summary-item-info">
                                        <div className="order-summary-item-name">{item.name}</div>
                                        <div className="order-summary-item-qty">{item.quantity} x {formatPrice(item.selling_price)}</div>
                                    </div>
                                    <div className="order-summary-item-price">
                                        {formatPrice(item.selling_price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                            <div className="order-summary-total">
                                <span>Total</span>
                                <span>{formatPrice(totalAmount)}</span>
                            </div>
                            <button
                                type="submit"
                                className="btn-primary"
                                style={{ width: '100%', marginTop: '20px' }}
                                disabled={submitting}
                            >
                                {submitting ? 'Memproses...' : '✅ Buat Pesanan'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <Footer />
        </>
    );
}
