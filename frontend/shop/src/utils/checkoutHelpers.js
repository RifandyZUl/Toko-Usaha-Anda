/**
 * Checkout Helper Utilities
 * Modular utility functions for geocoding, administrative cleaning, and payment scripts.
 */

/**
 * Dynamic script loader for Midtrans Snap JS
 */
export const loadMidtransSnap = () => {
  return new Promise(resolve => {
    if (window.snap) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-sample'
    const snapUrl = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'

    script.src = snapUrl
    script.setAttribute('data-client-key', clientKey)
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Helper to clean up City / Regency prefixes from administrative names in Indonesia
 */
export function cleanCityName(cityName) {
  if (!cityName) return ''
  return cityName.replace(/^(KOTA ADM\.|KAB\. ADM\.|KOTA|KABUPATEN|KAB\.)\s+/i, '').trim()
}

/**
 * Helper to clean up address detail from common noisy suffixes like house numbers, RT/RW, blocks
 */
export function cleanAddressDetail(addr) {
  if (!addr) return ''
  return (
    addr
      .replace(/rt\s*\d+\s*[-/]?\s*rw\s*\d+/gi, '')
      .replace(/rt\.\s*\d+\s*[-/]?\s*rw\.\s*\d+/gi, '')
      .replace(/rt\/rw\s*\d+\/\d+/gi, '')
      .replace(/rt\/rw\s*:\s*\d+\/\d+/gi, '')
      .replace(/\brt\b\s*\d+/gi, '')
      .replace(/\brw\b\s*\d+/gi, '')
      .replace(/no\.\s*\d+/gi, '')
      .replace(/no\s*\d+/gi, '')
      .replace(/blok\s*[a-z0-9-]+/gi, '')
      .replace(/kav\.\s*[a-z0-9-]+/gi, '')
      .replace(/lantai\s*\d+/gi, '')
      .replace(/lt\.\s*\d+/gi, '')
      .trim()
  )
}

/**
 * Clean whitespace and duplicate commas
 */
export function finalClean(str) {
  if (!str) return ''
  return str
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Helper to extract possible street name (e.g., "Jl. Merpati", "Jalan Merpati")
 */
export function extractStreetName(addr) {
  if (!addr) return ''
  const match = addr.match(/(?:jl\.|jalan|gg\.|gang)\s+([^,]+)/i)
  return match ? match[0].trim() : ''
}

/**
 * Progressive geocoder that queries Nominatim with fallback queries until a match is found
 */
export async function geocodeWithFallbacks(queries) {
  for (const q of queries) {
    if (!q || q.trim().length < 3) continue
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'TokoUsahaAndaCheckout/1.0',
        },
      })
      const json = await res.json()
      if (json && json.length > 0) {
        return {
          lat: json[0].lat,
          lng: json[0].lon,
          queryUsed: q,
        }
      }
    } catch (err) {
      console.error(`Geocoding failed for query: "${q}"`, err)
    }
  }
  return null
}

/**
 * Form validator for checkout page
 */
export function validateCheckoutForm(values) {
  const errors = {}

  if (!values.receiverName || values.receiverName.trim().length < 2) {
    errors.receiverName = 'Nama penerima minimal 2 karakter'
  }

  if (
    !values.shippingPhone ||
    !/^[0-9+\-\s()]+$/.test(values.shippingPhone) ||
    values.shippingPhone.trim().length < 9 ||
    values.shippingPhone.trim().length > 20
  ) {
    errors.shippingPhone = 'Nomor telepon harus berupa angka antara 9-20 karakter'
  }

  if (!values.addressDetail || values.addressDetail.trim().length < 10) {
    errors.addressDetail = 'Detail alamat minimal 10 karakter'
  }

  if (!values.province || values.province.trim().length === 0) {
    errors.province = 'Provinsi wajib diisi'
  }

  if (!values.city || values.city.trim().length === 0) {
    errors.city = 'Kota/Kabupaten wajib diisi'
  }

  if (!values.subdistrict || values.subdistrict.trim().length === 0) {
    errors.subdistrict = 'Kecamatan wajib diisi'
  }

  if (!values.kelurahan || values.kelurahan.trim().length === 0) {
    errors.kelurahan = 'Kelurahan wajib diisi'
  }

  if (!values.postalCode || !/^\d{5}$/.test(values.postalCode)) {
    errors.postalCode = 'Kode pos harus 5 digit angka'
  }

  return errors
}
