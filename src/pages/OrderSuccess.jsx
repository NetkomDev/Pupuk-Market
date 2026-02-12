import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function OrderSuccess() {
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
                        href="https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20baru%20saja%20checkout%20pesanan%20di%20PupukMarket.%20Mohon%20segera%20diproses."
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
