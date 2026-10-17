import { useState, useEffect } from 'react'

const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api'

export const useLocation = () => {
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [subdistricts, setSubdistricts] = useState([])
  const [villages, setVillages] = useState([])

  useEffect(() => {
    fetch(`${BASE_URL}/provinces.json`)
      .then(res => res.json())
      .then(setProvinces)
      .catch(console.error)
  }, [])

  const fetchCities = (provinceId) => {
    fetch(`${BASE_URL}/regencies/${provinceId}.json`)
      .then(res => res.json())
      .then(setCities)
      .catch(console.error)
  }

  const fetchSubdistricts = (cityId) => {
    fetch(`${BASE_URL}/districts/${cityId}.json`)
      .then(res => res.json())
      .then(setSubdistricts)
      .catch(console.error)
  }

  const fetchVillages = (subdistrictId) => {
    fetch(`${BASE_URL}/villages/${subdistrictId}.json`)
      .then(res => res.json())
      .then(setVillages)
      .catch(console.error)
  }

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
    setVillages
  }
}
