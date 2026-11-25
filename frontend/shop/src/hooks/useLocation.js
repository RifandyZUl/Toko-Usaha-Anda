import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../config/api'

/**
 * Indonesian region dropdown data (provinsi → kota → kecamatan → kelurahan).
 * Served by our backend (BinderByte wilayah, cached); villages include `postalCode`.
 * Fetchers are memoized so effects that depend on them don't re-fire every render.
 */
const loadRegions = async (endpoint, setter) => {
  try {
    const res = await apiClient.get(endpoint)
    setter(Array.isArray(res?.data) ? res.data : [])
  } catch (err) {
    console.error(`Failed to load regions from ${endpoint}:`, err)
    setter([])
  }
}

export const useLocation = () => {
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [subdistricts, setSubdistricts] = useState([])
  const [villages, setVillages] = useState([])

  useEffect(() => {
    loadRegions('/location/provinces', setProvinces)
  }, [])

  const fetchCities = useCallback(provinceId => {
    loadRegions(`/location/regencies/${encodeURIComponent(provinceId)}`, setCities)
  }, [])

  const fetchSubdistricts = useCallback(cityId => {
    loadRegions(`/location/districts/${encodeURIComponent(cityId)}`, setSubdistricts)
  }, [])

  const fetchVillages = useCallback(subdistrictId => {
    loadRegions(`/location/villages/${encodeURIComponent(subdistrictId)}`, setVillages)
  }, [])

  return {
    provinces,
    cities,
    subdistricts,
    villages,
    fetchCities,
    fetchSubdistricts,
    fetchVillages,
    setCities,
    setSubdistricts,
    setVillages,
  }
}
