import { API_BASE_URL } from '../config/api'

/**
 * Fetch dynamic shipping options calculated from server (RajaOngkir / zonasi)
 * @param {Object} params
 * @param {string} params.city - Destination city
 * @param {string} params.province - Destination province
 * @param {number} [params.weight] - Weight in grams
 * @returns {Promise<{zone: string, weightKg: number, options: Array}>}
 */
export async function getShippingRates({ city, province, weight = 1000 }) {
  try {
    const response = await fetch(`${API_BASE_URL}/shipping/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        city,
        province,
        weight,
      }),
    })

    if (!response.ok) {
      throw new Error('Gagal mengambil tarif pengiriman')
    }

    const data = await response.json()
    return data.data || null
  } catch (error) {
    console.warn('Shipping rate fetch fallback:', error.message)
    return null
  }
}
