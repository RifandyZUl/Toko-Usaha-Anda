/**
 * Application constants
 */

export const SECTIONS = {
  HOME: 'home',
  PRODUCTS: 'products',
  ABOUT: 'about',
  CONTACT: 'contact',
}

export const NAVIGATION_ITEMS = [
  { id: 'home', label: 'Beranda', href: '#home' },
  { id: 'products', label: 'Produk', href: '#products' },
  { id: 'about', label: 'Tentang', href: '#about' },
  { id: 'contact', label: 'Kontak', href: '#contact' },
]

export const PRODUCT_CATEGORIES = [
  {
    id: 'household',
    title: 'Alat Rumah Tangga',
    icon: 'Home',
    description: 'Lengkapi rumah Anda dengan berbagai alat rumah tangga berkualitas. Dari peralatan dapur hingga perlengkapan kebersihan.',
    features: [
      'Peralatan Dapur',
      'Perlengkapan Kebersihan',
      'Dekorasi Rumah',
      'Peralatan Makan',
    ],
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 'tools',
    title: 'Perkakas Tukang',
    icon: 'Wrench',
    description: 'Koleksi lengkap perkakas untuk berbagai keperluan konstruksi dan perbaikan. Kualitas profesional dengan harga terjangkau.',
    features: [
      'Perkakas Tangan',
      'Perkakas Listrik',
      'Bahan Bangunan',
      'Safety Equipment',
    ],
    color: 'from-blue-600 to-blue-700',
  },
  {
    id: 'motorcycle',
    title: 'Alat Motor',
    icon: 'Zap',
    description: 'Semua yang Anda butuhkan untuk perawatan dan perbaikan motor. Dari spare part hingga alat service profesional.',
    features: [
      'Spare Part Motor',
      'Alat Service',
      'Aksesoris Motor',
      'Peralatan Perawatan',
    ],
    color: 'from-red-400 to-red-500',
  },
]

export const FEATURES = [
  {
    icon: 'Wallet',
    title: 'Harga Terjangkau',
    description: 'Produk berkualitas dengan harga yang ramah di kantong',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: 'CheckCircle',
    title: 'Kualitas Terjamin',
    description: 'Semua produk melalui quality control ketat',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: 'Truck',
    title: 'Pengiriman Cepat',
    description: 'Layanan pengiriman cepat dan aman ke seluruh Indonesia',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: 'MessageCircle',
    title: 'Layanan Ramah',
    description: 'Customer service siap membantu 24/7',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: 'ShieldCheck',
    title: 'Garansi Produk',
    description: 'Garansi resmi untuk semua produk yang dijual',
    color: 'bg-teal-100 text-teal-600',
  },
  {
    icon: 'Star',
    title: 'Terpercaya',
    description: 'Ribuan pelanggan puas dengan layanan kami',
    color: 'bg-amber-100 text-amber-600',
  },
]

export const STATS = [
  { number: '1000+', label: 'Produk' },
  { number: '5000+', label: 'Pelanggan' },
  { number: '98%', label: 'Kepuasan' },
]

export const CONTACT_INFO = [
  {
    icon: 'MapPin',
    title: 'Alamat',
    content: 'Jl. Raya Toko No. 123\nJakarta, Indonesia',
  },
  {
    icon: 'Phone',
    title: 'Telepon',
    content: '+62 812-3456-7890',
  },
  {
    icon: 'Mail',
    title: 'Email',
    content: 'info@3macam10000.com',
  },
  {
    icon: 'Clock',
    title: 'Jam Operasional',
    content: 'Senin - Minggu\n08:00 - 20:00 WIB',
  },
]

export const SOCIAL_LINKS = [
  { icon: 'Share2', label: 'Facebook', href: '#' },
  { icon: 'AtSign', label: 'Instagram', href: '#' },
  { icon: 'MessageCircle', label: 'WhatsApp', href: '#' },
]

export const FOOTER_LINKS = {
  categories: [
    { label: 'Alat Rumah Tangga', href: '#products' },
    { label: 'Perkakas Tukang', href: '#products' },
    { label: 'Alat Motor', href: '#products' },
  ],
  information: [
    { label: 'Tentang Kami', href: '#about' },
    { label: 'Kontak', href: '#contact' },
    { label: 'Lokasi', href: '#contact' },
  ],
}

