import { useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { SettingsContext } from '../App';

export default function OrderSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const { settings } = useContext(SettingsContext) || {};
    const { customerName, items, autoRedirect } = location.state || {};

    let waMessage = 'Halo Admin, saya baru saja checkout pesanan di PupukMarket. Mohon segera diproses.';

    if (customerName && items && items.length > 0) {
        const itemsList = items.map(item => `${item.name} (${item.quantity})`).join(', ');
        waMessage = `Halo Admin, ada order masuk dari ${customerName}, ${itemsList}. Mohon diproses.`;
    }

    const waNumber = settings?.whatsapp_number || '6281234567890';
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

    useEffect(() => {
        if (autoRedirect) {
            // Redirect to WhatsApp automatically after a short delay
            const timer = setTimeout(() => {
                window.location.href = waUrl;
                // Clear the redirect flag to prevent loop on back navigation
                navigate(location.pathname, { replace: true, state: { ...location.state, autoRedirect: false } });
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [autoRedirect, waUrl, navigate, location]);

    return (
        <>
            <Navbar onCartOpen={() => { }} />
            <div className="order-success">
                <div className="success-icon">✅</div>
                <h1>Pesanan Berhasil!</h1>
                <p>
                    Terima kasih atas pesanan Anda. Pesanan sedang diproses dan kami akan segera menghubungi Anda.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                    <Link to="/" className="btn-secondary" style={{ width: 'auto' }}>
                        ← Kembali ke Beranda
                    </Link>
                    <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                        style={{ width: 'auto', backgroundColor: '#25D366', borderColor: '#25D366' }}
                    >
                        📱 Konfirmasi via WhatsApp
                    </a>
                </div>
            </div>
            <Footer />
        </>
    );
}
