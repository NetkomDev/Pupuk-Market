import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { SettingsContext } from '../App';

export default function Footer() {
    const { settings } = useContext(SettingsContext) || {};

    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <h3>🌿 {settings?.store_name || 'PupukMarket'}</h3>
                    <p>Marketplace pupuk terpercaya untuk kebutuhan pertanian Anda. Menyediakan berbagai jenis pupuk berkualitas dengan harga terbaik.</p>
                    <div className="social-links" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                        {settings?.instagram_url && (
                            <a href={settings.instagram_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', fontSize: '1.2rem' }}>📸</a>
                        )}
                        {settings?.facebook_url && (
                            <a href={settings.facebook_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', fontSize: '1.2rem' }}>f</a>
                        )}
                    </div>
                </div>
                <div className="footer-links">
                    <h4>Navigasi</h4>
                    <Link to="/">Beranda</Link>
                    <Link to="/">Produk</Link>
                    <Link to="/admin">Admin</Link>
                </div>
                <div className="footer-links">
                    <h4>Kontak</h4>
                    {settings?.email && <a href={`mailto:${settings.email}`}>📧 {settings.email}</a>}
                    {settings?.phone && <a href={`https://wa.me/${settings.whatsapp_number || settings.phone.replace(/[^0-9]/g, '')}`}>📱 {settings.phone}</a>}
                    {settings?.address && <a href="#">📍 {settings.address}</a>}
                </div>
            </div>
            <div className="footer-bottom">
                &copy; {new Date().getFullYear()} {settings?.store_name || 'PupukMarket'} | <a href="https://netkomdev.vercel.app/" target="_blank" rel="noreferrer" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}>NETKOMdev</a>. Semua hak dilindungi.
            </div>
        </footer >
    );
}
