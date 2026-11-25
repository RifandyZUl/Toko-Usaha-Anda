import { apiClient } from '../config/api'

/**
 * Fetch exact courier tariffs (BinderByte) from the server.
 * The server computes the parcel weight from the items, so the fee shown equals the fee charged.
 * @param {Object} params
 * @param {string} params.villageId - Kelurahan ID, e.g. "36.71.11.1005"
 * @param {Array<{productId: string, variantId: string|null, quantity: number}>} params.items - Items being checked out
 * @returns {Promise<{options: Array, error: string|null}>} never an estimate: on failure options is empty
 */
export async function getShippingRates({ villageId, items }) {
  try {
    const res = await apiClient.post('/shipping/calculate', { villageId, items })
    return { options: res?.data?.options || [], error: null }
  } catch (error) {
    return { options: [], error: error.message || 'Ongkos kirim belum bisa dihitung. Silakan coba lagi.' }
  }
}
