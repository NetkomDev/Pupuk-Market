import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <h3>🌿 PupukMarket</h3>
                    <p>Marketplace pupuk terpercaya untuk kebutuhan pertanian Anda. Menyediakan berbagai jenis pupuk berkualitas dengan harga terbaik.</p>
                </div>
                <div className="footer-links">
                    <h4>Navigasi</h4>
                    <Link to="/">Beranda</Link>
                    <Link to="/">Produk</Link>
                    <Link to="/admin">Admin</Link>
                </div>
                <div className="footer-links">
                    <h4>Kontak</h4>
                    <a href="#">📧 info@pupukmarket.id</a>
                    <a href="#">📱 +62 812-3456-7890</a>
                    <a href="#">📍 Indonesia</a>
                </div>
            </div>
            <div className="footer-bottom">
                &copy; {new Date().getFullYear()} PupukMarket. Semua hak dilindungi.
            </div>
        </footer>
    );
}
