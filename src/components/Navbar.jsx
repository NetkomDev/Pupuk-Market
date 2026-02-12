import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext, SettingsContext } from '../App';

export default function Navbar({ onCartOpen }) {
    const { totalItems } = useContext(CartContext);
    const { settings } = useContext(SettingsContext) || {};
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">🌿</div>
                    {settings?.store_name || 'PupukMarket'}
                </Link>

                <form className="navbar-search" onSubmit={handleSearch}>
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Cari pupuk..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </form>

                <div className="navbar-actions">
                    <button className="cart-btn" onClick={onCartOpen}>
                        🛒
                        {totalItems > 0 && (
                            <span className="cart-badge">{totalItems}</span>
                        )}
                    </button>
                </div>
            </div>
        </nav>
    );
}
