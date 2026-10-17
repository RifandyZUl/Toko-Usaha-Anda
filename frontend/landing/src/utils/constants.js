/**
 * Application constants
 */

export const SECTIONS = {
  HOME: 'home',
  PRODUCTS: 'products',
  ABOUT: 'about',
  CONTACT: 'contact',
}

export const SHOP_URL = import.meta.env.VITE_SHOP_URL || 'http://localhost:3001'
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const NAVIGATION_ITEMS = [
  { id: 'home', label: 'Beranda', href: '#home' },
  { id: 'products', label: 'Produk', href: SHOP_URL },
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
