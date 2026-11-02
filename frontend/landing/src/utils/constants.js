/**
 * Application constants
 */

export const SECTIONS = {
  HOME: 'home',
  PRODUCTS: 'products',
  ABOUT: 'about',
  CONTACT: 'contact',
}

const resolveShopUrl = () => {
  const envUrl = import.meta.env.VITE_SHOP_URL
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    let clean = envUrl.trim()
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`
    }
    clean = clean.replace(/\/+$/, '')
    // Mencegah kesalahan konfigurasi jika env keliru diarahkan ke domain API backend
    if (clean === 'https://toko-usaha-anda.vercel.app' || clean.endsWith('://toko-usaha-anda.vercel.app')) {
      return 'https://toko-usaha-anda-qkaq.vercel.app'
    }
    return clean
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://toko-usaha-anda-qkaq.vercel.app'
  }
  return 'http://localhost:3001'
}

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    let clean = envUrl.trim()
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`
    }
    clean = clean.replace(/\/+$/, '')
    if (!clean.endsWith('/api')) clean = `${clean}/api`
    return clean
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://toko-usaha-anda.vercel.app/api'
  }
  return 'http://localhost:5000/api'
}

export const SHOP_URL = resolveShopUrl()
export const API_BASE_URL = resolveApiBaseUrl()

export const NAVIGATION_ITEMS = [
  { id: 'home', label: 'Beranda', href: '#home' },
  { id: 'products', label: 'Produk', href: `${SHOP_URL}/shop` },
  { id: 'about', label: 'Tentang', href: '#about' },
  { id: 'contact', label: 'Kontak', href: '#contact' },
]

// Centralized contact details for Toko Usaha Anda
export const CONTACT_PHONE = '+62 882-1145-9051'
export const CONTACT_WHATSAPP = '6288211459051'
export const CONTACT_EMAIL = 'info@tokousahaanda.com'
export const CONTACT_ADDRESS = 'Jl. KH. Mas Mansyur, Tangerang, Indonesia'
export const CONTACT_MAPS_URL = 'https://maps.app.goo.gl/L9H3kr58VYgGwVTh7'
export const CONTACT_HOURS = 'Senin - Minggu: 07:00 - 22:00 WIB'
