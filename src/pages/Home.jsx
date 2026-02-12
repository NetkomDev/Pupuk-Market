import { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CartContext } from '../App';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cartOpen, setCartOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [heroSearch, setHeroSearch] = useState('');

    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        loadCategories();
        loadProducts();
    }, [selectedCategory, searchQuery]);

    async function loadCategories() {
        const { data } = await supabase
            .from('pupuk_categories')
            .select('*')
            .order('name');
        if (data) setCategories(data);
    }

    async function loadProducts() {
        setLoading(true);
        let query = supabase
            .from('pupuk_products')
            .select(`
        *,
        pupuk_categories(name),
        pupuk_brands(name)
      `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (selectedCategory) {
            query = query.eq('category_id', selectedCategory);
        }

        if (searchQuery) {
            query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data } = await query;
        if (data) {
            setProducts(data.map(p => ({
                ...p,
                category_name: p.pupuk_categories?.name,
                brand_name: p.pupuk_brands?.name,
            })));
        }
        setLoading(false);
    }

    const handleHeroSearch = (e) => {
        e.preventDefault();
        if (heroSearch.trim()) {
            setSearchParams({ search: heroSearch.trim() });
        } else {
            setSearchParams({});
        }
    };

    return (
        <>
            <Navbar onCartOpen={() => setCartOpen(true)} />
            <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

            {/* Hero */}
            <section className="hero">
                <div className="hero-content">
                    <h1>Pupuk Berkualitas untuk Pertanian Lebih Baik</h1>
                    <p>Temukan berbagai jenis pupuk terbaik dari supplier terpercaya. Harga bersaing, kualitas terjamin untuk hasil panen maksimal.</p>
                    <div className="hero-btns">
                        <button className="btn-hero" onClick={() => {
                            document.getElementById('products-start').scrollIntoView({ behavior: 'smooth' });
                        }}>
                            Lihat Produk
                        </button>
                    </div>
                </div>
            </section>

            {/* Category chips */}
            <section className="category-section" id="products-start">
                <div className="category-chips">
                    <button
                        className={`category-chip ${!selectedCategory ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(null)}
                    >
                        <div className="chip-icon">📦</div>
                        <span className="chip-label">Semua</span>
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            <div className="chip-icon">{cat.icon || '🌱'}</div>
                            <span className="chip-label">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Products */}
            <section className="products-section">
                <div className="section-header">
                    <h2>{searchQuery ? `Hasil pencarian: "${searchQuery}"` : 'Produk Terbaru'}</h2>
                    <span>{products.length} produk</span>
                </div>

                {loading ? (
                    <div className="loading-spinner"><div className="spinner" /></div>
                ) : products.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <h3>Produk tidak ditemukan</h3>
                        <p>Coba kata kunci lain atau lihat semua produk</p>
                    </div>
                ) : (
                    <div className="product-grid">
                        {products.map(p => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                )}
            </section>

            <Footer />
        </>
    );
}
