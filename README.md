# Pupuk Market 🌿

Marketplace pupuk modern yang menghubungkan supplier dan petani Indonesia. Dibangun dengan **Vite + React** dan **Supabase**.

![Preview](/public/images/products/phonska-npk.png)

## Fitur Utama

- **Public Storefront**: Katalog produk, pencarian, detail produk.
- **Keranjang Belanja**: Keranjang slide-out dengan localStorage persistence.
- **Checkout Mudah**: Form alamat otomatis (API Wilayah Indonesia) dan caching data pelanggan.
- **Admin Dashboard**: Manajemen produk, kategori, merek, supplier, dan pesanan.
- **Responsive**: Desain mobile-first yang modern dan cepat.

## Teknologi

- **Frontend**: React, Vite, CSS Modules
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel

## Cara Menjalankan (Development)

1. Clone repository ini
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` ke `.env` (jika ada, atau pastikan `src/lib/supabase.js` terkonfigurasi)
4. Jalankan server development:
   ```bash
   npm run dev
   ```

## Deployment ke Vercel

Lihat panduan lengkap di [DEPLOY.md](DEPLOY.md).

1. Push ke GitHub
2. Import project di Vercel Dashboard
3. Deploy!

## Struktur Database

Lihat `supabase-setup.sql` untuk skema database lengkap.

---
Dikembangkan oleh **NetkomDev**.
