import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext, ToastContext } from '../App';
import { SUPABASE_URL } from '../lib/supabase';

function formatPrice(price) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(price);
}

export default function ProductCard({ product }) {
    const { addItem } = useContext(CartContext);
    const addToast = useContext(ToastContext);

    const handleAddCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
        addToast(`${product.name} ditambahkan ke keranjang`, '🛒');
    };

    const imageUrl = product.image_url
        ? (product.image_url.startsWith('http') || product.image_url.startsWith('/') ? product.image_url : `${SUPABASE_URL}/storage/v1/object/public/pupuk-images/${product.image_url}`)
        : 'https://placehold.co/400x400/E8F5E9/1B5E20?text=Pupuk';

    return (
        <Link to={`/product/${product.slug}`} className="product-card">
            <div className="product-card-image">
                <img src={imageUrl} alt={product.name} loading="lazy" />
                {product.category_name && (
                    <span className="product-card-badge">{product.category_name}</span>
                )}
            </div>
            <div className="product-card-body">
                {product.brand_name && (
                    <div className="product-card-category">{product.brand_name}</div>
                )}
                <h3 className="product-card-name">{product.name}</h3>
                <p className="product-card-desc">{product.description}</p>
                <div className="product-card-footer">
                    <div className="product-card-price">
                        {formatPrice(product.selling_price)}
                        <small>/{product.unit || 'kg'}</small>
                    </div>
                    <button className="btn-add-cart" onClick={handleAddCart} title="Tambah ke keranjang">
                        +
                    </button>
                </div>
            </div>
        </Link>
    );
}
