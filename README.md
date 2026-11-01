# Toko Usaha Anda — Platform E-Commerce & Landing Page

Repositori monorepo resmi untuk **Toko Usaha Anda** — platform toko online modern dengan desain terinspirasi dari gaya minimalis Nike. Menyediakan alat kebutuhan rumah tangga, perkakas tukang, dan alat-alat motor berkualitas tinggi.

---

## 🏗️ Struktur Arsitektur Monorepo

```
Landing Page Toko/
├── backend/                  # RESTful API Server (Node.js, Express, PostgreSQL, Prisma)
├── frontend/
│   ├── landing/              # Landing Page resmi toko (React, Vite, Tailwind CSS)
│   ├── shop/                 # Web Store & E-Commerce App (React, Vite, Tailwind CSS, Zustand)
│   └── shared/               # Komponen UI, Icons, dan utilitas bersama
└── README.md                 # Dokumentasi Root Proyek
```

---

## 🌟 Aplikasi & Komponen Utama

### 1. `backend/` (REST API Server)
- **Framework**: Node.js + Express.js.
- **Database**: PostgreSQL dengan Prisma ORM.
- **Keamanan & Performa**:
  - Dual-channel authentication (Email & WhatsApp OTP).
  - Secure Forgot Password flow dengan single-use token dan perlindungan *timing attacks*.
  - Cluster & multi-instance safe dengan sesi reset tersimpan di PostgreSQL.
  - Rate limiting, Anti-DDOS request limits, Helmet, dan sanitasi XSS.
  - Pengindeksan database (B-Tree indexes) pada seluruh kolom pencarian utama.
- **Background Cron Services**:
  - Auto-expire pesanan pending setelah 24 jam dengan auto-restock.
  - Auto-complete pesanan terkirim.
  - Auto-cleanup sesi auth & OTP kedaluwarsa setiap 1 jam.
- **Integrasi Eksternal**: Midtrans (Payment Gateway), Supabase (Image Cloud Storage), Fonnte (WhatsApp Gateway), Nodemailer (Gmail SMTP), BinderByte (Tracking Kurir).
- 📖 *Selengkapnya:* Lihat [backend/README.md](file:///c:/Cursor-Project/Landing%20Page%20Toko/backend/README.md)

### 2. `frontend/shop/` (Toko Online / E-Commerce App)
- **Framework**: React 18 + Vite + Tailwind CSS.
- **Fitur Toko**:
  - Navigasi katalog kategori resmi: *Kebutuhan Rumah Tangga*, *Perkakas Tukang*, dan *Alat Alat Motor*.
  - Detail produk interaktif dengan matriks varian harga & stok dinamis.
  - Keranjang belanja cerdas dengan sinkronisasi multi-tab dan pemulihan otomatis saat login.
  - Fitur seleksi item keranjang sebelum checkout.
  - Checkout fleksibel dengan integrasi alamat otomatis, pencarian kode pos wilayah, serta pilihan kurir.
  - Pembayaran Midtrans Snap terintegrasi langsung di aplikasi.
  - Fitur Lupa Kata Sandi multi-langkah via Email / WhatsApp.
  - Manajemen riwayat pesanan pelanggan dan status pelacakan resi pengiriman real-time.

### 3. `frontend/landing/` (Landing Page Promosi)
- **Framework**: React 18 + Vite + Tailwind CSS.
- **Fitur**:
  - Hero Section dengan CTA dinamis ke toko.
  - Showcase produk unggulan dan kategori resmi.
  - Formulir pesan kontak pelanggan langsung tersimpan ke database.
  - Integrasi lokasi toko dengan Google Maps.

---

## 🚀 Panduan Menjalankan Proyek Secara Lokal

### Prasyarat
1. **Node.js** (v18.x atau lebih baru)
2. **PostgreSQL** (v14.x atau lebih baru)
3. **NPM** atau **Yarn**

### 1. Menjalankan Backend API
```bash
cd backend
npm install
# Konfigurasi file .env (lihat backend/README.md)
npm run prisma:push
npm run dev
```
Backend akan berjalan di: `http://localhost:5000`

### 2. Menjalankan Frontend Shop (Toko E-Commerce)
```bash
cd frontend/shop
npm install
npm run dev
```
Toko online akan berjalan di: `http://localhost:3001` (atau port default Vite yang tersedia).

### 3. Menjalankan Frontend Landing (Landing Page)
```bash
cd frontend/landing
npm install
npm run dev
```
Landing page akan berjalan di: `http://localhost:3000`.

---

## 🔒 Kebijakan Keamanan & Standar Kualitas

Proyek ini dipersiapkan untuk **taraf produksi nyata**:
1. **Data Pelanggan & Transaksi**: Seluruh perhitungan harga, total pesanan, dan diskon dihitung ulang di server (*server-authoritative*). Tidak mempercayai data dari browser client.
2. **Atomic Inventory**: Pengurangan dan pengembalian stok barang saat checkout dan pembatalan dilakukan dalam transaksi atomik Prisma (`$transaction`).
3. **Pembersihan Cache & Sesi**: Sesi pengguna dan keranjang dibersihkan secara lokal saat logout, dan tersinkronisasi aman di server.

---

## 📄 Lisensi
Hak Cipta Terpelihara © Toko Usaha Anda.
