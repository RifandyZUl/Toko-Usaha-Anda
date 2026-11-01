# Backend API — Toko Usaha Anda (Production Ready)

Backend RESTful API untuk platform e-commerce **Toko Usaha Anda** yang dibangun menggunakan **Node.js**, **Express**, **PostgreSQL**, dan **Prisma ORM**.

Sistem ini dirancang untuk **keamanan tinggi**, **efisiensi kueri database (indexing & caching)**, serta **skalabilitas multi-instance / cluster**.

---

## 🚀 Fitur Utama & Keamanan

### 1. Autentikasi & Otorisasi Canggih
- **Dual-Channel Registration**: Mendukung registrasi via Email (dengan validasi domain aktif via DNS MX dan strict Email OTP) dan WhatsApp-first registration via OTP WhatsApp (gateway Fonnte).
- **Dual-Channel Login**: Pengguna dapat masuk menggunakan alamat email atau nomor WhatsApp resmi.
- **Proteksi Brute Force & Rate Limiting**:
  - `authLimiter` pada endpoint autentikasi.
  - `generalLimiter` pada seluruh request publik.
- **Timing-Attack Protection**:
  - Menggunakan dummy hash jika akun tidak ditemukan saat login.
  - Menggunakan `crypto.timingSafeEqual` pada komparasi OTP.

### 2. Fitur Lupa Kata Sandi (Cluster-Safe)
- **Anti User-Enumeration**: Memberikan respon generik dan delay acak tiruan jika akun tidak ditemukan.
- **PostgreSQL-Backed Session**: Status OTP dan reset token disimpan di tabel `password_reset_sessions`, aman dijalankan di server multi-worker/cluster tanpa sticky session.
- **Single-Use Cryptographic Reset Token**: Mencegah replay attack dengan konsumsi token atomik.
- **Background Cleaner Cron**: Membersihkan sesi pemulihan kata sandi kedaluwarsa secara otomatis setiap 1 jam.

### 3. Database Indexing & Optimasi Kueri
- Indeks B-Tree pada kolom sensitif pencarian:
  - `users`: `email` (unique), `phone`.
  - `products`: `isActive`, `categoryId`, composite `[categoryId, isActive]`, dan `createdAt`.
  - `product_variants`: composite `[productId, isActive, deletedAt]`.
  - `orders`: `userId`, `status`, `paymentStatus`.
  - `password_reset_sessions`: `[identifier, channel]`, `resetToken` (unique), `expiresAt`.

### 4. Transaksi & Pembayaran Terintegrasi
- **Midtrans Payment Gateway**: Mendukung Snap payment, GoPay, QRIS, Virtual Account Bank (BCA, BNI, BRI, Mandiri, Permata).
- **Auto-Expiry Orders**: Background cron otomatis membatalkan pesanan pending yang melewati batas waktu pembayaran (24 jam) dan mengembalikan stok produk secara atomik.
- **Auto-Complete Orders**: Background cron otomatis menandai pesanan selesai jika barang telah diterima/dikirim dalam jangka waktu tertentu.

### 5. Pengiriman & Kode Pos
- **Live Courier Tracking**: Integrasi BinderByte API dengan in-memory LRU cache (TTL 15 menit) untuk efisiensi kuota API.
- **Postal Code Lookup**: Pencarian kode pos dan wilayah otomatis dengan caching 24 jam.

---

## 🛠️ Tech Stack & Dependencies

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma Client v5.22+
- **Security**: Helmet, HPP, CORS, bcrypt (cost factor 12), express-validator
- **Storage**: Supabase Cloud Storage (dengan fallback penyimpanan lokal)
- **Email Service**: Nodemailer (Gmail SMTP dengan fallback mode simulasi)
- **WhatsApp Gateway**: Fonnte API (dengan fallback mode simulasi dev)
- **Payment Gateway**: Midtrans Client SDK

---

## 📋 Prerequisites & Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Konfigurasi Environment Variables (`.env`)
Salin atau sesuaikan file `.env` di folder `backend/`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/toko_usaha_anda?schema=public"
JWT_SECRET="your-super-secure-jwt-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000,http://localhost:3001"

# Supabase Storage (Upload Gambar Produk)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_STORAGE_BUCKET=product-images

# Midtrans Configuration
MIDTRANS_SERVER_KEY="Mid-server-xxxx"
MIDTRANS_CLIENT_KEY="Mid-client-xxxx"
MIDTRANS_IS_PRODUCTION=false

# Courier Tracking API (Opsional: https://binderbyte.com)
BINDERBYTE_API_KEY=""

# WhatsApp OTP Gateway (Fonnte: https://fonnte.com)
FONNTE_TOKEN="your-fonnte-token"

# Email SMTP OTP (Gmail App Password)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-app-password"
SMTP_FROM="your-email@gmail.com"
```

### 3. Migrasi & Sinkronisasi Database
```bash
# Sinkronkan skema Prisma ke database PostgreSQL
npm run prisma:push

# Generate Prisma Client
npm run prisma:generate

# (Opsional) Buka GUI Prisma Studio
npm run prisma:studio
```

### 4. Menjalankan Server
```bash
# Mode Development
npm run dev

# Mode Production
npm start
```
Server berjalan default di `http://localhost:5000`.

---

## 📡 Ringkasan API Endpoints

### 1. Autentikasi (`/api/auth`)
| Method | Endpoint | Deskripsi | Proteksi |
|---|---|---|---|
| `POST` | `/register` | Mendaftar akun baru (Email/WhatsApp jalur terpisah) | Rate Limited |
| `POST` | `/login` | Masuk akun menggunakan Email atau No. WhatsApp | Rate Limited |
| `POST` | `/logout` | Keluar dan membersihkan cookie JWT | Publik |
| `GET` | `/me` | Mendapatkan data profil akun saat ini | Bearer Token |
| `PUT` | `/profile` | Memperbarui nama, no. HP, dan alamat pelanggan | Bearer Token |
| `POST` | `/forgot-password` | Meminta kode OTP pemulihan kata sandi | Rate Limited |
| `POST` | `/verify-reset-otp`| Verifikasi OTP reset & terbitkan `resetToken` | Rate Limited |
| `POST` | `/reset-password` | Mengatur ulang password dengan `resetToken` | Rate Limited |
| `POST` | `/send-email-otp` | Mengirim OTP verifikasi pendaftaran email | Rate Limited |
| `POST` | `/send-register-wa-otp` | Mengirim OTP registrasi via WhatsApp | Rate Limited |

### 2. Produk & Kategori (`/api/products`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/` | Daftar semua produk aktif (Pagination, Filter Kategori, Search) |
| `GET` | `/:id` | Detail produk beserta varian aktifnya |
| `GET` | `/featured` | Produk terlaris/unggulan untuk landing & etalase |
| `GET` | `/categories` | Kategori produk resmi toko |
| `POST` | `/` | Tambah produk baru (Admin only) |
| `PUT` | `/:id` | Perbarui data produk & matriks varian (Admin only) |
| `DELETE` | `/:id` | Hapus produk (Admin only) |

### 3. Keranjang Belanja (`/api/cart`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/` | Mengambil isi keranjang belanja user aktif |
| `POST` | `/` | Menambahkan item/varian produk ke keranjang |
| `PUT` | `/:id` | Mengubah kuantitas item keranjang |
| `DELETE` | `/:id` | Menghapus 1 item dari keranjang |
| `DELETE` | `/` | Mengosongkan keranjang |

### 4. Pesanan & Checkout (`/api/orders`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/` | Membuat pesanan baru dari checkout item terpilih |
| `GET` | `/` | Riwayat pesanan pelanggan aktif |
| `GET` | `/:id` | Detail lengkap pesanan, kurir, dan item yang dibeli |
| `PUT` | `/:id/status` | Update status pengiriman pesanan (Admin only) |

### 5. Pembayaran (`/api/payment` & `/api/webhook`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/payment/create-transaction` | Membuat transaksi Snap token Midtrans |
| `POST` | `/webhook/midtrans` | Webhook notifikasi Midtrans (verifikasi signature SHA-512) |

---

## ⏱️ Background Cron Services

Server Express menjalankan 3 background cron terisolasi saat startup:
1. **Order Expiry Cron**: Berjalan setiap 60 detik (`orderExpiryService.js`).
2. **Order Auto-Complete Cron**: Berjalan setiap 5 menit (`orderAutoCompleteService.js`).
3. **Auth Session Cleanup Cron**: Berjalan setiap 1 jam (`otpService.js`), menghapus sesi reset dan OTP yang telah lewat batas waktu kedaluwarsa.
