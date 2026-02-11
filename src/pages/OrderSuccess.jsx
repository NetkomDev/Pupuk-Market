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
                    Terima kasih atas pesanan Anda. Pesanan sedang diproses dan kami akan segera menghubungi Anda melalui WhatsApp untuk konfirmasi pengiriman.
                </p>
                <Link to="/" className="btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
                    ← Kembali ke Beranda
                </Link>
            </div>
            <Footer />
        </>
    );
}
