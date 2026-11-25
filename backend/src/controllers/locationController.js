/**
 * Location Controller
 * Serves Indonesian administrative regions (BinderByte wilayah) to the storefront
 */

import { getProvinces, getRegencies, getDistricts, getVillages } from '../services/wilayahService.js'

function respondWith(loader) {
  return async (req, res, next) => {
    try {
      const data = await loader(req.params.id)
      res.status(200).json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }
}

// GET /api/location/provinces
export const listProvinces = respondWith(() => getProvinces())

// GET /api/location/regencies/:id  (id = provinsi, e.g. "36")
export const listRegencies = respondWith(id => getRegencies(id))

// GET /api/location/districts/:id  (id = kabupaten/kota, e.g. "36.71")
export const listDistricts = respondWith(id => getDistricts(id))

// GET /api/location/villages/:id  (id = kecamatan, e.g. "36.71.11"); each village includes postalCode
export const listVillages = respondWith(id => getVillages(id))
