import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase, SUPABASE_URL } from '../../lib/supabase';
import { ToastContext, SettingsContext } from '../../App';

function formatPrice(price) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
}

function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminDashboard() {
    const { user, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();
    const addToast = useContext(ToastContext);
    const { settings, setSettings } = useContext(SettingsContext) || {};
    const [activeTab, setActiveTab] = useState('dashboard');
    const [settingsForm, setSettingsForm] = useState({});

    useEffect(() => {
        if (settings) {
            setSettingsForm(settings);
        }
    }, [settings]);

    // Data
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, suppliers: 0 });

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState(null);

    // Order detail
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);

    useEffect(() => {
        if (!authLoading && !user) navigate('/admin');
    }, [user, authLoading]);

    useEffect(() => {
        if (user) {
            loadAllData();

            // Realtime subscription for new orders
            const subscription = supabase
                .channel('public:pupuk_orders')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pupuk_orders' }, payload => {
                    const newOrder = payload.new;
                    setOrders(prev => [newOrder, ...prev]);
                    setStats(prev => ({
                        ...prev,
                        orders: prev.orders + 1,
                        revenue: prev.revenue + (Number(newOrder.total_amount) || 0)
                    }));
                    addToast(`Pesanan Baru: ${formatPrice(newOrder.total_amount)}`, '🔔');
                    // Play notification sound if possible, but browser policy might block it without interaction.
                    // Simple beep logic:
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.play().catch(e => console.log('Audio play failed', e));
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [user]);

    async function loadAllData() {
        const [catRes, brandRes, supRes, prodRes, ordRes] = await Promise.all([
            supabase.from('pupuk_categories').select('*').order('name'),
            supabase.from('pupuk_brands').select('*').order('name'),
            supabase.from('pupuk_suppliers').select('*').order('name'),
            supabase.from('pupuk_products').select('*, pupuk_categories(name), pupuk_brands(name), pupuk_suppliers(name)').order('created_at', { ascending: false }),
            supabase.from('pupuk_orders').select('*').order('created_at', { ascending: false }),
        ]);
        setCategories(catRes.data || []);
        setBrands(brandRes.data || []);
        setSuppliers(supRes.data || []);
        setProducts(prodRes.data || []);
        setOrders(ordRes.data || []);

        const totalRevenue = (ordRes.data || [])
            .filter(o => o.status !== 'dibatalkan')
            .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

        setStats({
            products: (prodRes.data || []).length,
            orders: (ordRes.data || []).length,
            revenue: totalRevenue,
            suppliers: (supRes.data || []).length,
        });
    }

    function openModal(type, item = null) {
        setModalType(type);
        setEditItem(item);
        setImageFile(null);
        if (item) {
            setFormData({ ...item });
        } else {
            const defaults = {
                product: { name: '', description: '', category_id: '', brand_id: '', supplier_id: '', cost_price: 0, selling_price: 0, stock: 0, unit: 'kg', weight: '', is_active: true },
                category: { name: '', slug: '', icon: '🌱' },
                brand: { name: '' },
                supplier: { name: '', phone: '', address: '', notes: '' },
            };
            setFormData(defaults[type] || {});
        }
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditItem(null);
        setFormData({});
        setImageFile(null);
    }

    async function handleSave() {
        setSaving(true);
        try {
            let data = { ...formData };
            const table = `pupuk_${modalType === 'product' ? 'products' : modalType === 'category' ? 'categories' : modalType === 'brand' ? 'brands' : 'suppliers'}`;

            // Handle image upload for product
            if (modalType === 'product' && imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('pupuk-images')
                    .upload(fileName, imageFile);
                if (uploadError) throw uploadError;
                data.image_url = fileName;
            }

            if (modalType === 'product' && !editItem) {
                data.slug = slugify(data.name) + '-' + Date.now().toString(36);
            }

            if (modalType === 'category' && !editItem) {
                data.slug = slugify(data.name);
            }

            // Clean up join data
            delete data.pupuk_categories;
            delete data.pupuk_brands;
            delete data.pupuk_suppliers;

            if (editItem) {
                const { error } = await supabase.from(table).update(data).eq('id', editItem.id);
                if (error) throw error;
            } else {
                delete data.id;
                const { error } = await supabase.from(table).insert(data);
                if (error) throw error;
            }

            closeModal();
            loadAllData();
        } catch (err) {
            console.error(err);
            alert('Gagal menyimpan: ' + err.message);
        }
        setSaving(false);
    }

    async function handleDelete(table, id) {
        if (!confirm('Yakin ingin menghapus?')) return;
        await supabase.from(table).delete().eq('id', id);
        loadAllData();
    }

    async function updateOrderStatus(orderId, status) {
        await supabase.from('pupuk_orders').update({ status }).eq('id', orderId);
        loadAllData();
        if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, status }));
    }

    async function viewOrderDetail(order) {
        setSelectedOrder(order);
        const { data } = await supabase.from('pupuk_order_items').select('*').eq('order_id', order.id);
        setOrderItems(data || []);
    }

    async function handleSaveSettings() {
        setSaving(true);
        try {
            const { error } = await supabase.from('pupuk_store_settings').update(settingsForm).eq('id', settingsForm.id);
            if (error) throw error;
            setSettings(settingsForm);
            addToast('Pengaturan berhasil disimpan!', '✅');
        } catch (err) {
            console.error(err);
            addToast('Gagal menyimpan pengaturan.', '❌');
        }
        setSaving(false);
    }

    const handleLogout = async () => {
        await signOut();
        navigate('/admin');
    };

    if (authLoading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!user) return null;

    const navItems = [
        { key: 'dashboard', icon: '📊', label: 'Dashboard' },
        { key: 'products', icon: '📦', label: 'Produk' },
        { key: 'categories', icon: '📂', label: 'Kategori' },
        { key: 'brands', icon: '🏷️', label: 'Merek' },
        { key: 'suppliers', icon: '🚚', label: 'Supplier' },
        { key: 'orders', icon: '🛍️', label: 'Pesanan' },
        { key: 'settings', icon: '⚙️', label: 'Pengaturan' },
    ];

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-logo">🌿 PupukMarket</div>
                <nav className="admin-sidebar-nav">
                    {navItems.map(item => (
                        <button
                            key={item.key}
                            className={`admin-nav-item ${activeTab === item.key ? 'active' : ''}`}
                            onClick={() => { setActiveTab(item.key); setSelectedOrder(null); }}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="admin-sidebar-footer">
                    <button className="admin-nav-item" onClick={() => window.open('/', '_blank')}>
                        <span className="nav-icon">🌐</span>
                        <span>Lihat Toko</span>
                    </button>
                    <button className="admin-nav-item" onClick={handleLogout}>
                        <span className="nav-icon">🚪</span>
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-content">
                {/* ====== DASHBOARD TAB ====== */}
                {activeTab === 'dashboard' && (
                    <>
                        <div className="admin-header">
                            <h1>Dashboard</h1>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-card-icon green">📦</div>
                                <div className="stat-card-value">{stats.products}</div>
                                <div className="stat-card-label">Total Produk</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-icon yellow">🛍️</div>
                                <div className="stat-card-value">{stats.orders}</div>
                                <div className="stat-card-label">Total Pesanan</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-icon blue">💰</div>
                                <div className="stat-card-value">{formatPrice(stats.revenue)}</div>
                                <div className="stat-card-label">Total Pendapatan</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-icon red">🚚</div>
                                <div className="stat-card-value">{stats.suppliers}</div>
                                <div className="stat-card-label">Total Supplier</div>
                            </div>
                        </div>

                        {/* Recent orders */}
                        <div className="admin-table-wrapper">
                            <div className="admin-table-header">
                                <h3>Pesanan Terbaru</h3>
                            </div>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Pelanggan</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.slice(0, 5).map(order => (
                                        <tr key={order.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>{order.customer_phone}</div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{formatPrice(order.total_amount)}</td>
                                            <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                                            <td style={{ color: 'var(--text-light)', fontSize: '13px' }}>{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ====== PRODUCTS TAB ====== */}
                {activeTab === 'products' && (
                    <>
                        <div className="admin-header">
                            <h1>Produk</h1>
                            <button className="btn-primary" style={{ width: 'auto' }} onClick={() => openModal('product')}>
                                + Tambah Produk
                            </button>
                        </div>
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Produk</th>
                                        <th>Kategori</th>
                                        <th>Harga Modal</th>
                                        <th>Harga Jual</th>
                                        <th>Stok</th>
                                        <th>Supplier</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="product-cell">
                                                    <img
                                                        src={p.image_url ? (p.image_url.startsWith('http') || p.image_url.startsWith('/') ? p.image_url : `${SUPABASE_URL}/storage/v1/object/public/pupuk-images/${p.image_url}`) : 'https://placehold.co/40x40/E8F5E9/1B5E20?text=P'}
                                                        alt={p.name}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{p.pupuk_brands?.name || '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{p.pupuk_categories?.name || '-'}</td>
                                            <td style={{ color: 'var(--text-light)' }}>{formatPrice(p.cost_price)}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatPrice(p.selling_price)}</td>
                                            <td>{p.stock} {p.unit}</td>
                                            <td>{p.pupuk_suppliers?.name || '-'}</td>
                                            <td>
                                                <span className={`status-badge ${p.is_active ? 'selesai' : 'dibatalkan'}`}>
                                                    {p.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="action-btn" onClick={() => openModal('product', p)} title="Edit">✏️</button>
                                                    <button className="action-btn delete" onClick={() => handleDelete('pupuk_products', p.id)} title="Hapus">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {products.length === 0 && (
                                <div className="empty-state">
                                    <h3>Belum ada produk</h3>
                                    <p>Tambahkan produk pertama Anda</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ====== CATEGORIES TAB ====== */}
                {activeTab === 'categories' && (
                    <>
                        <div className="admin-header">
                            <h1>Kategori</h1>
                            <button className="btn-primary" style={{ width: 'auto' }} onClick={() => openModal('category')}>
                                + Tambah Kategori
                            </button>
                        </div>
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Icon</th><th>Nama</th><th>Slug</th><th>Aksi</th></tr>
                                </thead>
                                <tbody>
                                    {categories.map(c => (
                                        <tr key={c.id}>
                                            <td style={{ fontSize: '20px' }}>{c.icon || '🌱'}</td>
                                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                                            <td style={{ color: 'var(--text-light)' }}>{c.slug}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="action-btn" onClick={() => openModal('category', c)}>✏️</button>
                                                    <button className="action-btn delete" onClick={() => handleDelete('pupuk_categories', c.id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {categories.length === 0 && <div className="empty-state"><h3>Belum ada kategori</h3></div>}
                        </div>
                    </>
                )}

                {/* ====== BRANDS TAB ====== */}
                {activeTab === 'brands' && (
                    <>
                        <div className="admin-header">
                            <h1>Merek</h1>
                            <button className="btn-primary" style={{ width: 'auto' }} onClick={() => openModal('brand')}>
                                + Tambah Merek
                            </button>
                        </div>
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Nama Merek</th><th>Aksi</th></tr>
                                </thead>
                                <tbody>
                                    {brands.map(b => (
                                        <tr key={b.id}>
                                            <td style={{ fontWeight: 600 }}>{b.name}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="action-btn" onClick={() => openModal('brand', b)}>✏️</button>
                                                    <button className="action-btn delete" onClick={() => handleDelete('pupuk_brands', b.id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {brands.length === 0 && <div className="empty-state"><h3>Belum ada merek</h3></div>}
                        </div>
                    </>
                )}

                {/* ====== SUPPLIERS TAB ====== */}
                {activeTab === 'suppliers' && (
                    <>
                        <div className="admin-header">
                            <h1>Supplier</h1>
                            <button className="btn-primary" style={{ width: 'auto' }} onClick={() => openModal('supplier')}>
                                + Tambah Supplier
                            </button>
                        </div>
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Nama</th><th>Telepon</th><th>Alamat</th><th>Catatan</th><th>Aksi</th></tr>
                                </thead>
                                <tbody>
                                    {suppliers.map(s => (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 600 }}>{s.name}</td>
                                            <td>{s.phone || '-'}</td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address || '-'}</td>
                                            <td style={{ color: 'var(--text-light)' }}>{s.notes || '-'}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="action-btn" onClick={() => openModal('supplier', s)}>✏️</button>
                                                    <button className="action-btn delete" onClick={() => handleDelete('pupuk_suppliers', s.id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {suppliers.length === 0 && <div className="empty-state"><h3>Belum ada supplier</h3></div>}
                        </div>
                    </>
                )}

                {/* ====== ORDERS TAB ====== */}
                {activeTab === 'orders' && !selectedOrder && (
                    <>
                        <div className="admin-header">
                            <h1>Pesanan</h1>
                        </div>
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Pelanggan</th><th>Alamat</th><th>Total</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr>
                                </thead>
                                <tbody>
                                    {orders.map(o => (
                                        <tr key={o.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{o.customer_name}</div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>{o.customer_phone}</div>
                                            </td>
                                            <td style={{ fontSize: '13px', maxWidth: '200px' }}>
                                                {[o.shipping_kelurahan, o.shipping_kecamatan, o.shipping_kabupaten, o.shipping_province].filter(Boolean).join(', ')}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{formatPrice(o.total_amount)}</td>
                                            <td>
                                                <select
                                                    className="form-input"
                                                    value={o.status}
                                                    onChange={e => updateOrderStatus(o.id, e.target.value)}
                                                    style={{ padding: '6px 10px', fontSize: '12px', minWidth: '120px' }}
                                                >
                                                    <option value="baru">Baru</option>
                                                    <option value="diproses">Diproses</option>
                                                    <option value="dikirim">Dikirim</option>
                                                    <option value="selesai">Selesai</option>
                                                    <option value="dibatalkan">Dibatalkan</option>
                                                </select>
                                            </td>
                                            <td style={{ color: 'var(--text-light)', fontSize: '13px' }}>{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
                                            <td>
                                                <button className="action-btn" onClick={() => viewOrderDetail(o)} title="Detail">👁️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {orders.length === 0 && <div className="empty-state"><h3>Belum ada pesanan</h3></div>}
                        </div>
                    </>
                )}

                {/* Order Detail View */}
                {activeTab === 'orders' && selectedOrder && (
                    <>
                        <div className="admin-header">
                            <h1>Detail Pesanan</h1>
                            <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>← Kembali</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-section">
                                <div className="form-section-title"><span className="section-icon">👤</span> Info Pelanggan</div>
                                <p><strong>Nama:</strong> {selectedOrder.customer_name}</p>
                                <p><strong>HP/WA:</strong> {selectedOrder.customer_phone}</p>
                                <p style={{ marginTop: '12px' }}><strong>Alamat:</strong></p>
                                <p>{selectedOrder.shipping_kelurahan}, {selectedOrder.shipping_kecamatan}</p>
                                <p>{selectedOrder.shipping_kabupaten}, {selectedOrder.shipping_province}</p>
                                <p>{selectedOrder.shipping_address_detail}</p>
                            </div>
                            <div className="form-section">
                                <div className="form-section-title"><span className="section-icon">📦</span> Status Pesanan</div>
                                <select className="form-input" value={selectedOrder.status} onChange={e => updateOrderStatus(selectedOrder.id, e.target.value)}>
                                    <option value="baru">Baru</option>
                                    <option value="diproses">Diproses</option>
                                    <option value="dikirim">Dikirim</option>
                                    <option value="selesai">Selesai</option>
                                    <option value="dibatalkan">Dibatalkan</option>
                                </select>
                            </div>
                        </div>
                        <div className="admin-table-wrapper" style={{ marginTop: '20px' }}>
                            <div className="admin-table-header"><h3>Item Pesanan</h3></div>
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Produk</th><th>Item</th><th>Harga</th><th>Subtotal</th></tr>
                                </thead>
                                <tbody>
                                    {orderItems.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                                            <td>{item.quantity} {item.unit}</td>
                                            <td>{formatPrice(item.unit_price)}</td>
                                            <td>{formatPrice(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ====== SETTINGS TAB ====== */}
                {activeTab === 'settings' && (
                    <>
                        <div className="admin-header">
                            <h1>Pengaturan Toko</h1>
                            <button className="btn-primary" style={{ width: 'auto' }} onClick={handleSaveSettings} disabled={saving}>
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                        <div className="settings-form" style={{ maxWidth: '800px', background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #eee' }}>
                            <div className="form-section-title">Informasi Dasar</div>
                            <div className="form-group">
                                <label>Nama Toko</label>
                                <input className="form-input" value={settingsForm.store_name || ''} onChange={e => setSettingsForm({ ...settingsForm, store_name: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nomor WhatsApp Admin (62xxx)</label>
                                    <input className="form-input" value={settingsForm.whatsapp_number || ''} onChange={e => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })} placeholder="6281234567890" />
                                    <small style={{ color: 'var(--text-light)' }}>Gunakan format 62 di depan (tanpa + atau 0).</small>
                                </div>
                                <div className="form-group">
                                    <label>Nomor Telepon (Tampil di Footer)</label>
                                    <input className="form-input" value={settingsForm.phone || ''} onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })} placeholder="0812-3456-7890" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Alamat Toko</label>
                                <textarea className="form-input" rows="3" value={settingsForm.address || ''} onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input className="form-input" value={settingsForm.email || ''} onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })} />
                            </div>

                            <div className="form-section-title" style={{ marginTop: '24px' }}>Sosial Media</div>
                            <div className="form-group">
                                <label>Instagram URL</label>
                                <input className="form-input" value={settingsForm.instagram_url || ''} onChange={e => setSettingsForm({ ...settingsForm, instagram_url: e.target.value })} placeholder="https://instagram.com/..." />
                            </div>
                            <div className="form-group">
                                <label>Facebook URL</label>
                                <input className="form-input" value={settingsForm.facebook_url || ''} onChange={e => setSettingsForm({ ...settingsForm, facebook_url: e.target.value })} placeholder="https://facebook.com/..." />
                            </div>
                            <div className="form-group">
                                <label>YouTube URL</label>
                                <input className="form-input" value={settingsForm.youtube_url || ''} onChange={e => setSettingsForm({ ...settingsForm, youtube_url: e.target.value })} placeholder="https://youtube.com/..." />
                            </div>
                            <div className="form-group">
                                <label>TikTok URL</label>
                                <input className="form-input" value={settingsForm.tiktok_url || ''} onChange={e => setSettingsForm({ ...settingsForm, tiktok_url: e.target.value })} placeholder="https://tiktok.com/..." />
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* ====== MODALS ====== */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editItem ? 'Edit' : 'Tambah'} {modalType === 'product' ? 'Produk' : modalType === 'category' ? 'Kategori' : modalType === 'brand' ? 'Merek' : 'Supplier'}</h3>
                            <button className="cart-drawer-close" onClick={closeModal}>✕</button>
                        </div>
                        <div className="modal-body">
                            {/* Product Form */}
                            {modalType === 'product' && (
                                <>
                                    <div className="form-group">
                                        <label>Nama Produk <span className="required">*</span></label>
                                        <input className="form-input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nama produk" />
                                    </div>
                                    <div className="form-group">
                                        <label>Deskripsi</label>
                                        <textarea className="form-input" rows="3" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi produk" style={{ resize: 'vertical' }} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Kategori</label>
                                            <select className="form-input" value={formData.category_id || ''} onChange={e => setFormData({ ...formData, category_id: e.target.value || null })}>
                                                <option value="">-- Pilih Kategori --</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Merek</label>
                                            <select className="form-input" value={formData.brand_id || ''} onChange={e => setFormData({ ...formData, brand_id: e.target.value || null })}>
                                                <option value="">-- Pilih Merek --</option>
                                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Supplier</label>
                                        <select className="form-input" value={formData.supplier_id || ''} onChange={e => setFormData({ ...formData, supplier_id: e.target.value || null })}>
                                            <option value="">-- Pilih Supplier --</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Harga Modal</label>
                                            <input type="number" className="form-input" value={formData.cost_price || ''} onChange={e => setFormData({ ...formData, cost_price: Number(e.target.value) })} placeholder="0" />
                                        </div>
                                        <div className="form-group">
                                            <label>Harga Jual <span className="required">*</span></label>
                                            <input type="number" className="form-input" value={formData.selling_price || ''} onChange={e => setFormData({ ...formData, selling_price: Number(e.target.value) })} placeholder="0" />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Stok</label>
                                            <input type="number" className="form-input" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} placeholder="0" />
                                        </div>
                                        <div className="form-group">
                                            <label>Satuan</label>
                                            <select className="form-input" value={formData.unit || 'kg'} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                                                <option value="kg">Kilogram (kg)</option>
                                                <option value="karung">Karung</option>
                                                <option value="liter">Liter</option>
                                                <option value="botol">Botol</option>
                                                <option value="sachet">Sachet</option>
                                                <option value="pcs">Pcs</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Gambar Produk</label>
                                        <input type="file" className="form-input" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={formData.is_active !== false} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                            Produk aktif (tampil di toko)
                                        </label>
                                    </div>
                                </>
                            )}

                            {/* Category Form */}
                            {modalType === 'category' && (
                                <>
                                    <div className="form-group">
                                        <label>Nama Kategori <span className="required">*</span></label>
                                        <input className="form-input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value, slug: editItem ? formData.slug : slugify(e.target.value) })} placeholder="Contoh: Pupuk Organik" />
                                    </div>
                                    <div className="form-group">
                                        <label>Slug</label>
                                        <input className="form-input" value={formData.slug || ''} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="pupuk-organik" />
                                    </div>
                                    <div className="form-group">
                                        <label>Icon (Emoji)</label>
                                        <input className="form-input" value={formData.icon || ''} onChange={e => setFormData({ ...formData, icon: e.target.value })} placeholder="🌱" />
                                    </div>
                                </>
                            )}

                            {/* Brand Form */}
                            {modalType === 'brand' && (
                                <div className="form-group">
                                    <label>Nama Merek <span className="required">*</span></label>
                                    <input className="form-input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Contoh: Phonska" />
                                </div>
                            )}

                            {/* Supplier Form */}
                            {modalType === 'supplier' && (
                                <>
                                    <div className="form-group">
                                        <label>Nama Supplier <span className="required">*</span></label>
                                        <input className="form-input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nama supplier" />
                                    </div>
                                    <div className="form-group">
                                        <label>No. Telepon</label>
                                        <input className="form-input" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
                                    </div>
                                    <div className="form-group">
                                        <label>Alamat</label>
                                        <textarea className="form-input" rows="2" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Alamat supplier" style={{ resize: 'vertical' }} />
                                    </div>
                                    <div className="form-group">
                                        <label>Catatan</label>
                                        <textarea className="form-input" rows="2" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Catatan tambahan" style={{ resize: 'vertical' }} />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeModal}>Batal</button>
                            <button className="btn-primary" style={{ width: 'auto' }} onClick={handleSave} disabled={saving}>
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
