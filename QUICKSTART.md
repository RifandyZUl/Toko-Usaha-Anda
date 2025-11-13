# Quick Start Guide

## 🚀 Instalasi Cepat

### 1. Install Dependencies

```bash
npm install
```

### 2. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173` (default Vite port)

### 3. Build untuk Production

```bash
npm run build
```

File yang sudah di-build akan ada di folder `dist/`

### 4. Preview Production Build

```bash
npm run preview
```

## 📝 Scripts yang Tersedia

- `npm run dev` - Development server dengan hot reload (Vite)
- `npm run build` - Build untuk production (optimized)
- `npm run preview` - Preview production build
- `npm run lint` - Lint code dengan ESLint
- `npm run format` - Format code dengan Prettier

## 🎯 Struktur Project

```
src/
├── components/       # React components
│   ├── common/      # Reusable components (Button, Card, Icon, etc.)
│   ├── layout/      # Layout components (Navigation, Footer)
│   └── sections/    # Page sections (Hero, Products, Features, About, Contact)
├── hooks/           # Custom React hooks
│   ├── useScroll.js              # Scroll tracking dengan auto-hide nav
│   ├── useIntersectionObserver.js # Element visibility detection
│   ├── useForm.js                # Form handling dengan validation
│   ├── useActiveSection.js       # Active section tracking
│   └── useScrollToTop.js         # Scroll to top functionality
├── utils/           # Utility functions
│   ├── validators.js    # Form validation
│   ├── scroll.js        # Scroll utilities
│   └── constants.js     # Application constants
├── assets/          # Static assets (images, etc.)
│   └── hero-bg.png  # Hero background image
├── App.jsx          # Main app component
├── main.jsx         # React entry point
└── index.css        # Global styles dengan Tailwind
```

## 🎨 Design System

### Color Scheme
- **Primary**: Blue (primary-50 hingga primary-950)
- **Secondary**: Gray/Black untuk contrast
- Edit `tailwind.config.js` untuk customisasi

### Typography
- **Heading**: Poppins (Bold, SemiBold)
- **Body**: Inter (Regular, Medium, Semibold)
- Custom font sizes: `text-display`, `text-heading-1` hingga `text-heading-4`, `text-body-xl` hingga `text-body-xs`

### Key Features
- ✅ Auto-hide navigation saat scroll down
- ✅ Professional animations dengan Intersection Observer
- ✅ Background image di Hero section
- ✅ Modern footer design
- ✅ Responsive di semua perangkat

## 🔧 Kustomisasi

### Mengubah Warna & Theme

Edit `tailwind.config.js`:
```js
colors: {
  primary: { /* blue shades */ },
  secondary: { /* gray/black shades */ }
}
```

### Mengubah Konten

Edit `src/utils/constants.js` untuk mengubah:
- Navigation items
- Product categories
- Features
- Contact information
- Social media links
- Footer links

### Mengubah Background Hero

1. Ganti file `src/assets/hero-bg.png` dengan gambar Anda
2. Atau update import di `src/components/sections/Hero.jsx`:
```jsx
import heroBg from '../../assets/your-image.png'
```

### Menambah Section Baru

1. Buat component baru di `src/components/sections/YourSection.jsx`
2. Import dan tambahkan ke `src/App.jsx`
3. Tambahkan navigation item di `src/utils/constants.js`
4. Gunakan `useIntersectionObserver` hook untuk animations:
```jsx
const [ref, isIntersecting] = useIntersectionObserver()
```

## 📱 Testing

Buka browser dan navigasi ke `http://localhost:5173` (atau port yang ditampilkan di terminal) untuk melihat aplikasi.

### Fitur yang Bisa Dicoba:
- ✅ Scroll ke bawah → Navigation akan otomatis hilang
- ✅ Scroll ke atas → Navigation akan muncul kembali
- ✅ Hover pada cards → Lihat hover effects
- ✅ Scroll ke section → Lihat entry animations
- ✅ Klik navigation links → Smooth scroll ke section
- ✅ Submit contact form → Lihat validation

## 🐛 Troubleshooting

### Port sudah digunakan

Jika port 3000 sudah digunakan, Vite akan otomatis menggunakan port lain.

### Dependencies error

Hapus `node_modules` dan `package-lock.json`, lalu install ulang:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Build error

Pastikan semua dependencies terinstall dengan benar:

```bash
npm install
```

## 📚 Dokumentasi

Lihat `README.md` untuk dokumentasi lengkap.

