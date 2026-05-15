# 🛡️ Admin Panel - Toko Usaha Anda

Admin panel untuk mengelola produk, pesanan, dan aktivitas toko.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Admin panel akan berjalan di `http://localhost:3002`

## 🔐 Login

Default admin credentials (setelah seed database):
- **Email**: `admin@toko.com`
- **Password**: `admin123`

## ✨ Fitur

### Dashboard
- Statistik total produk
- Statistik total pesanan
- Total pendapatan
- Pesanan pending

### Kelola Produk
- Lihat semua produk
- Tambah produk baru
- Edit produk
- Hapus produk
- Filter berdasarkan kategori
- Search produk

### Kelola Pesanan
- Lihat semua pesanan
- Filter berdasarkan status
- Update status pesanan (Pending → Processing → Shipped → Delivered)
- Detail pesanan lengkap

## 📋 Tech Stack

- React 18
- Vite
- Tailwind CSS
- Zustand (State Management)
- React Router
- Lucide React (Icons)

## 🔧 Configuration

Pastikan backend API berjalan di `http://localhost:5000` atau set environment variable:

```env
VITE_API_URL=http://localhost:5000/api
```

## ⚠️ Catatan

1. **CORS**: Pastikan backend mengizinkan request dari `http://localhost:3002`. Update `FRONTEND_URL` di `.env` backend:
   ```env
   FRONTEND_URL="http://localhost:3000,http://localhost:3001,http://localhost:3002"
   ```

2. **Admin Role**: Hanya user dengan role `ADMIN` yang bisa mengakses admin panel.

3. **Authentication**: Token disimpan di localStorage dengan key `admin_auth_token`.

## 📁 Struktur Folder

```
frontend/admin/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AdminLayout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ProductsPage.jsx
│   │   └── OrdersPage.jsx
│   ├── services/
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── orders.js
│   ├── stores/
│   │   └── authStore.js
│   ├── config/
│   │   └── api.js
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

