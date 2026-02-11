import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import { CartContext, ToastContext } from '../App';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import ProductCard from '../components/ProductCard';

function formatPrice(price) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(price);
}

export default function ProductDetail() {
    const { slug } = useParams();
    const { addItem } = useContext(CartContext);
    const addToast = useContext(ToastContext);
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [cartOpen, setCartOpen] = useState(false);

    useEffect(() => {
        loadProduct();
    }, [slug]);

    async function loadProduct() {
        setLoading(true);
        const { data } = await supabase
            .from('pupuk_products')
            .select(`
        *,
        pupuk_categories(name),
        pupuk_brands(name)
      `)
            .eq('slug', slug)
            .single();

        if (data) {
            setProduct({
                ...data,
                category_name: data.pupuk_categories?.name,
                brand_name: data.pupuk_brands?.name,
            });

            // Load related products
            if (data.category_id) {
                const { data: relatedData } = await supabase
                    .from('pupuk_products')
                    .select('*, pupuk_categories(name), pupuk_brands(name)')
                    .eq('category_id', data.category_id)
                    .eq('is_active', true)
                    .neq('id', data.id)
                    .limit(4);
                if (relatedData) {
                    setRelated(relatedData.map(p => ({
                        ...p,
                        category_name: p.pupuk_categories?.name,
                        brand_name: p.pupuk_brands?.name,
                    })));
                }
            }
        }
        setLoading(false);
    }

    const handleAddCart = () => {
        if (product) {
            addItem(product, quantity);
            addToast(`${quantity}x ${product.name} ditambahkan ke keranjang`, '🛒');
        }
    };

    if (loading) {
        return (
            <>
                <Navbar onCartOpen={() => setCartOpen(true)} />
                <div className="loading-spinner"><div className="spinner" /></div>
            </>
        );
    }

    if (!product) {
        return (
            <>
                <Navbar onCartOpen={() => setCartOpen(true)} />
                <div className="empty-state">
                    <div className="empty-icon">😔</div>
                    <h3>Produk tidak ditemukan</h3>
                    <p><Link to="/">← Kembali ke beranda</Link></p>
                </div>
            </>
        );
    }

    const imageUrl = product.image_url
        ? (product.image_url.startsWith('http') || product.image_url.startsWith('/') ? product.image_url : `${SUPABASE_URL}/storage/v1/object/public/pupuk-images/${product.image_url}`)
        : 'https://placehold.co/600x600/E8F5E9/1B5E20?text=Pupuk';

    return (
        <>
            <Navbar onCartOpen={() => setCartOpen(true)} />
            <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

            <div className="breadcrumb">
                <Link to="/">Beranda</Link>
                <span className="separator">›</span>
                {product.category_name && (
                    <>
                        <span>{product.category_name}</span>
                        <span className="separator">›</span>
                    </>
                )}
                <span className="current">{product.name}</span>
            </div>

            <div className="product-detail">
                <div className="product-detail-image">
                    <img src={imageUrl} alt={product.name} />
                </div>
                <div className="product-detail-info">
                    {product.category_name && (
                        <span className="product-detail-category">{product.category_name}</span>
                    )}
                    <h1>{product.name}</h1>
                    {product.brand_name && (
                        <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '16px' }}>
                            Merek: <strong>{product.brand_name}</strong>
                        </p>
                    )}
                    <div className="product-detail-price">
                        {formatPrice(product.selling_price)}
                        <small> / {product.unit || 'kg'}</small>
                    </div>
                    <div className="product-detail-stock">
                        <span className={`stock-dot ${product.stock > 0 ? '' : 'out'}`} />
                        {product.stock > 0 ? `Stok tersedia: ${product.stock} ${product.unit || 'kg'}` : 'Stok habis'}
                    </div>
                    <div className="product-detail-desc">
                        {product.description || 'Tidak ada deskripsi produk.'}
                    </div>

                    <div className="quantity-selector">
                        <label>Jumlah:</label>
                        <div className="quantity-controls">
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                            <span>{quantity}</span>
                            <button onClick={() => setQuantity(q => q + 1)}>+</button>
                        </div>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleAddCart}
                        disabled={product.stock <= 0}
                    >
                        🛒 Tambah ke Keranjang
                    </button>
                </div>
            </div>

            {related.length > 0 && (
                <section className="products-section">
                    <div className="section-header">
                        <h2>Produk Serupa</h2>
                    </div>
                    <div className="product-grid">
                        {related.map(p => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </section>
            )}

            <Footer />
        </>
    );
}
