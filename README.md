# Toko Usaha Anda - Landing Page

Landing page modern dan profesional untuk toko yang dibangun dengan **React**, **Vite**, dan **Tailwind CSS**. Project ini mengikuti best practices dan design patterns yang digunakan oleh programmer profesional, dengan design system yang modern dan professional seperti company profile perusahaan besar.

## 🚀 Teknologi yang Digunakan

- **React 18** - Library UI modern dengan hooks
- **Vite** - Build tool yang sangat cepat
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Modern icon library dengan 1000+ icons
- **ESLint** - Code linting untuk kualitas code
- **Prettier** - Code formatter untuk konsistensi

## ✨ Fitur

- ✅ **Modern React Architecture** - Component-based dengan hooks
- ✅ **Responsive Design** - Tampilan optimal di semua perangkat
- ✅ **Performance Optimized** - Lazy loading, code splitting, dan optimasi
- ✅ **Accessibility** - ARIA labels, keyboard navigation, screen reader support
- ✅ **SEO Friendly** - Semantic HTML, meta tags, proper structure
- ✅ **Custom Hooks** - Reusable hooks untuk scroll, form, intersection observer
- ✅ **Type Safety** - PropTypes dan validasi
- ✅ **Clean Code** - ESLint, Prettier, dan best practices
- ✅ **Design Patterns** - Separation of concerns, single responsibility principle
- ✅ **Professional Animations** - Smooth animations dengan Intersection Observer dan CSS animations
- ✅ **Modern Design** - Black & Blue color scheme dengan professional typography (Poppins & Inter)
- ✅ **Smart Navigation** - Auto-hide navigation saat scroll down, muncul saat scroll up
- ✅ **Hero Section** - Background image dengan gradient overlay dan professional animations
- ✅ **Modern Footer** - Clean footer design dengan informasi toko dan social media

## 📁 Struktur Project

```
.
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── common/       # Reusable components (Button, Card, Icon, Section, etc.)
│   │   ├── layout/       # Layout components (Navigation, Footer)
│   │   └── sections/     # Page sections (Hero, Products, Features, About, Contact)
│   ├── hooks/            # Custom React hooks
│   │   ├── useScroll.js              # Scroll tracking dengan auto-hide nav
│   │   ├── useIntersectionObserver.js # Element visibility detection
│   │   ├── useForm.js                 # Form handling dengan validation
│   │   ├── useActiveSection.js        # Active section tracking
│   │   └── useScrollToTop.js          # Scroll to top functionality
│   ├── utils/            # Utility functions
│   │   ├── validators.js    # Form validation
│   │   ├── scroll.js        # Scroll utilities
│   │   └── constants.js     # Application constants
│   ├── assets/           # Static assets
│   │   └── hero-bg.png  # Hero background image
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # React entry point
│   └── index.css         # Global styles dengan Tailwind
├── .eslintrc.cjs         # ESLint configuration
├── .prettierrc           # Prettier configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies dan scripts
```

## 🛠️ Instalasi & Penggunaan

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Instalasi

1. **Clone atau download project ini**

2. **Install dependencies:**
```bash
npm install
```

3. **Jalankan development server:**
```bash
npm run dev
```

4. **Build untuk production:**
```bash
npm run build
```

5. **Preview production build:**
```bash
npm run preview
```

## 📝 Scripts

- `npm run dev` - Menjalankan development server
- `npm run build` - Build untuk production
- `npm run preview` - Preview production build
- `npm run lint` - Menjalankan ESLint
- `npm run format` - Format code dengan Prettier

## 🎨 Design Patterns & Best Practices

### 1. Component Architecture

- **Separation of Concerns** - Setiap component memiliki tanggung jawab tunggal
- **Reusability** - Components dibuat reusable dan dapat digunakan kembali
- **Composition** - Components dikomposisi untuk membangun UI yang kompleks

### 2. Custom Hooks

- **useScroll** - Track scroll position dan direction untuk navbar auto-hide/show effects
- **useIntersectionObserver** - Detect element visibility untuk animations
- **useForm** - Form handling dengan validation
- **useActiveSection** - Track active section untuk navigation highlighting
- **useScrollToTop** - Scroll to top functionality

### 3. Utility Functions

- **Validators** - Form validation functions
- **Scroll** - Scroll utility functions
- **Constants** - Application constants dan configuration

### 4. State Management

- **Local State** - useState untuk component-level state
- **Custom Hooks** - Reusable state logic dengan custom hooks
- **Form State** - useForm hook untuk form state management

### 5. Performance Optimization

- **Code Splitting** - Automatic code splitting dengan Vite
- **Lazy Loading** - Intersection Observer untuk lazy loading
- **Memoization** - useCallback dan useMemo untuk optimization
- **Throttling/Debouncing** - Optimized event handlers

### 6. Accessibility

- **ARIA Labels** - Proper ARIA labels untuk screen readers
- **Keyboard Navigation** - Full keyboard navigation support
- **Focus Management** - Proper focus management
- **Semantic HTML** - Semantic HTML elements

### 7. SEO

- **Meta Tags** - Proper meta tags di index.html
- **Semantic HTML** - Semantic HTML structure
- **Structured Data** - Ready for structured data implementation

## 🎯 Components Overview

### Common Components

- **Button** - Reusable button component dengan variants
- **Card** - Card component dengan hover effects
- **Section** - Section wrapper dengan consistent styling
- **SectionHeader** - Section header dengan title dan subtitle
- **Notification** - Notification component untuk alerts
- **ScrollToTop** - Scroll to top button

### Layout Components

- **Navigation** - Navigation bar dengan mobile menu, auto-hide on scroll down, modern compact design
- **Footer** - Modern footer dengan informasi toko, navigation links, contact info, dan social media

### Section Components

- **Hero** - Hero section dengan background image, professional animations, stats display, dan CTA buttons
- **Products** - Products section dengan categories cards dan hover effects
- **Features** - Features section dengan benefits dan modern card design
- **About** - About section dengan company info, visi & misi
- **Contact** - Contact section dengan form validation dan contact information

## 🔧 Kustomisasi

### Design System

#### Color Scheme
Project menggunakan **Black & Blue** color scheme yang profesional:
- **Primary**: Blue shades (primary-50 hingga primary-950)
- **Secondary**: Gray/Black shades untuk contrast
- Edit `tailwind.config.js` untuk mengubah color palette

#### Typography
- **Heading Font**: Poppins (Bold, SemiBold)
- **Body Font**: Inter (Regular, Medium, Semibold)
- Custom font sizes tersedia di `tailwind.config.js`:
  - `text-display`, `text-display-md`
  - `text-heading-1` hingga `text-heading-4`
  - `text-body-xl` hingga `text-body-xs`

#### Animations
- Entry animations dengan Intersection Observer
- Stagger animations untuk list items
- Gradient animations untuk text dan backgrounds
- Hover effects dengan scale dan translate

### Mengubah Konten

Edit file di `src/utils/constants.js` untuk mengubah:
- Navigation items
- Product categories
- Features
- Contact information
- Social media links
- Footer links

### Mengubah Background Hero

1. Ganti file `src/assets/hero-bg.png` dengan gambar Anda
2. Atau update import di `src/components/sections/Hero.jsx`

### Menambah Section Baru

1. Buat component baru di `src/components/sections/`
2. Import dan tambahkan ke `src/App.jsx`
3. Tambahkan navigation item di `src/utils/constants.js`
4. Gunakan `useIntersectionObserver` hook untuk animations

## 📱 Responsive Breakpoints

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 768px (md)
- **Desktop**: >= 768px (lg)
- **Large Desktop**: >= 1024px (xl)
- **Extra Large**: >= 1280px (2xl)

Semua components menggunakan responsive design dengan Tailwind breakpoints.

## 🔒 Keamanan

- Form validation di client-side
- XSS protection dengan proper escaping
- Sanitasi input (disarankan tambahkan server-side validation)
- HTTPS recommended untuk production

## 📈 Performance

- **Lighthouse Score**: Target 90+ untuk semua metrics
- **Code Splitting**: Automatic dengan Vite
- **Tree Shaking**: Automatic dengan Vite
- **Minification**: Automatic pada production build
- **Image Optimization**: Ready for image optimization

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📦 Production Deployment

1. **Build project:**
```bash
npm run build
```

2. **Preview build:**
```bash
npm run preview
```

3. **Deploy ke hosting:**
   - Vercel (recommended)
   - Netlify
   - GitHub Pages
   - AWS S3 + CloudFront
   - Custom server

## 🧪 Testing (Future)

- Unit tests dengan Jest dan React Testing Library
- Integration tests
- E2E tests dengan Cypress
- Visual regression tests

## 🆕 Recent Updates

### Design & UX Improvements
- ✅ **Color Scheme**: Updated ke Black & Blue professional theme
- ✅ **Typography**: Implementasi Poppins (heading) & Inter (body) dengan custom font sizes
- ✅ **Hero Section**: Background image dengan gradient overlay dan professional animations
- ✅ **Navigation**: Auto-hide saat scroll down, muncul saat scroll up
- ✅ **Footer**: Modern footer design dengan informasi toko dan social media
- ✅ **Animations**: Professional entry animations dengan stagger effects
- ✅ **Responsive**: Optimized untuk semua perangkat

### Technical Improvements
- ✅ **Icons**: Migrated ke Lucide React untuk modern icons
- ✅ **Scroll Behavior**: Smart navigation dengan scroll direction detection
- ✅ **Performance**: Optimized animations dengan CSS dan Intersection Observer
- ✅ **Code Quality**: Clean code dengan ESLint dan Prettier

## 📝 TODO / Pengembangan Selanjutnya

- [ ] Tambahkan unit tests
- [ ] Tambahkan integration tests
- [ ] Implementasi dark mode
- [ ] Tambahkan multi-language support (i18n)
- [ ] Integrasi dengan backend API
- [ ] Tambahkan CMS integration
- [ ] Implementasi PWA
- [ ] Tambahkan analytics tracking
- [ ] Optimasi images dengan WebP
- [ ] Tambahkan blog section
- [ ] Implementasi payment gateway

## 📄 License

MIT License - bebas digunakan untuk keperluan komersial maupun non-komersial.

## 👤 Author

**Toko Usaha Anda**

## 🙏 Acknowledgments

- React team untuk library yang luar biasa
- Vite team untuk build tool yang cepat
- Tailwind CSS team untuk utility-first framework
- Google Fonts untuk Poppins & Inter fonts
- Lucide React untuk modern icon library
- Design inspiration dari modern company profiles dan [TISOO](https://tisoo.id/)

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)

---

**Note**: Untuk production, pastikan untuk:
1. Setup environment variables
2. Integrate dengan backend API
3. Setup analytics tracking
4. Optimize images
5. Setup CDN untuk static assets
6. Test di berbagai browser dan perangkat
7. Setup monitoring dan error tracking
8. Setup CI/CD pipeline
