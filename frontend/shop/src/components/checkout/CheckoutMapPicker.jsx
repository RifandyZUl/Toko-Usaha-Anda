import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import {
  cleanCityName,
  cleanAddressDetail,
  finalClean,
  extractStreetName,
  geocodeWithFallbacks,
} from '../../utils/checkoutHelpers'

/**
 * CheckoutMapPicker - Interactive Leaflet & Nominatim map picker component
 */
export default function CheckoutMapPicker({ values, handleChange }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerInstanceRef = useRef(null)
  const lastGeocodedAddressRef = useRef('')
  const [mapVisible, setMapVisible] = useState(!!values.latitude && !!values.longitude)
  const [mapOverrideVisible, setMapOverrideVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const preventSuggestionsRef = useRef(false)
  const searchContainerRef = useRef(null)

  const initMap = useCallback(
    (lat, lng) => {
      if (!window.L) return

      const parsedLat = parseFloat(lat) || -6.2088
      const parsedLng = parseFloat(lng) || 106.8456

      if (!mapInstanceRef.current) {
        if (!mapRef.current) return

        const map = window.L.map(mapRef.current).setView([parsedLat, parsedLng], 16)
        mapInstanceRef.current = map

        window.L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: 'Map data &copy; Google',
        }).addTo(map)

        const DefaultIcon = window.L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })

        const marker = window.L.marker([parsedLat, parsedLng], {
          draggable: true,
          icon: DefaultIcon,
        }).addTo(map)
        markerInstanceRef.current = marker

        marker.on('dragend', () => {
          const position = marker.getLatLng()
          handleChange({ target: { name: 'latitude', value: position.lat.toString() } })
          handleChange({ target: { name: 'longitude', value: position.lng.toString() } })
        })

        map.on('click', e => {
          const { lat: clickLat, lng: clickLng } = e.latlng
          marker.setLatLng([clickLat, clickLng])
          handleChange({ target: { name: 'latitude', value: clickLat.toString() } })
          handleChange({ target: { name: 'longitude', value: clickLng.toString() } })
        })
      } else {
        const map = mapInstanceRef.current
        const marker = markerInstanceRef.current

        map.setView([parsedLat, parsedLng], 16)
        if (marker) {
          marker.setLatLng([parsedLat, parsedLng])
        }
      }
    },
    [handleChange]
  )

  const handleActivateMapManual = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude.toString()
          const lng = position.coords.longitude.toString()
          handleChange({ target: { name: 'latitude', value: lat } })
          handleChange({ target: { name: 'longitude', value: lng } })
          setMapOverrideVisible(true)
        },
        () => {
          handleChange({ target: { name: 'latitude', value: '-6.2088' } })
          handleChange({ target: { name: 'longitude', value: '106.8456' } })
          setMapOverrideVisible(true)
        }
      )
    } else {
      handleChange({ target: { name: 'latitude', value: '-6.2088' } })
      handleChange({ target: { name: 'longitude', value: '106.8456' } })
      setMapOverrideVisible(true)
    }
  }, [handleChange])

  const handleSearchLocation = useCallback(async () => {
    if (!searchQuery || searchQuery.trim().length < 3) return
    try {
      const cleanedQuery = finalClean(cleanAddressDetail(searchQuery))
      const queries = [searchQuery, cleanedQuery]

      if (values.province && values.city) {
        const cleanedCity = cleanCityName(values.city)
        if (values.kelurahan && values.subdistrict) {
          queries.push(
            finalClean(
              `${values.kelurahan}, ${values.subdistrict}, ${cleanedCity}, ${values.province}, Indonesia`
            )
          )
        }
        if (values.subdistrict) {
          queries.push(
            finalClean(`${values.subdistrict}, ${cleanedCity}, ${values.province}, Indonesia`)
          )
        }
        queries.push(finalClean(`${cleanedCity}, ${values.province}, Indonesia`))
        queries.push(finalClean(`${values.province}, Indonesia`))
      }

      const result = await geocodeWithFallbacks(queries)
      if (result) {
        handleChange({ target: { name: 'latitude', value: result.lat } })
        handleChange({ target: { name: 'longitude', value: result.lng } })

        if (mapInstanceRef.current) {
          initMap(result.lat, result.lng)
        }
      } else {
        alert('Lokasi tidak ditemukan. Silakan coba cari dengan kata kunci lain.')
      }
    } catch (err) {
      console.error('Search location error:', err)
    }
  }, [
    searchQuery,
    values.province,
    values.city,
    values.subdistrict,
    values.kelurahan,
    initMap,
    handleChange,
  ])

  useEffect(() => {
    if (preventSuggestionsRef.current) {
      preventSuggestionsRef.current = false
      return
    }

    if (!searchQuery || searchQuery.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true)
      try {
        const query = encodeURIComponent(searchQuery)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`,
          {
            headers: {
              'User-Agent': 'TokoUsahaAndaCheckout/1.0',
            },
          }
        )
        const json = await res.json()
        if (json && Array.isArray(json)) {
          setSuggestions(json)
          setShowSuggestions(json.length > 0)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch (err) {
        console.error('Fetch suggestions error:', err)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = e => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const isAddressFilled =
      values.province &&
      values.city &&
      values.subdistrict &&
      values.kelurahan &&
      values.addressDetail &&
      values.addressDetail.trim().length >= 10

    if (!isAddressFilled) {
      if (!values.latitude || !values.longitude) {
        setMapVisible(false)
      }
      return
    }

    setMapVisible(true)

    const fullAddress = `${values.addressDetail}, ${values.kelurahan}, ${values.subdistrict}, ${values.city}, ${values.province}, Indonesia`

    if (fullAddress === lastGeocodedAddressRef.current) {
      return
    }

    const displayQuery = finalClean(
      `${cleanAddressDetail(values.addressDetail)}, ${values.kelurahan}, ${values.subdistrict}, ${cleanCityName(values.city)}`
    )
    preventSuggestionsRef.current = true
    setSearchQuery(displayQuery || `${values.addressDetail}, ${values.kelurahan}`)

    const delayDebounceFn = setTimeout(async () => {
      const cleanedDetail = cleanAddressDetail(values.addressDetail)
      const cleanedCity = cleanCityName(values.city)
      const streetName = extractStreetName(values.addressDetail)

      const queries = []
      if (cleanedDetail) {
        queries.push(
          finalClean(
            `${cleanedDetail}, ${values.kelurahan}, ${values.subdistrict}, ${cleanedCity}, ${values.province}, Indonesia`
          )
        )
      }
      queries.push(fullAddress)
      if (streetName) {
        queries.push(
          finalClean(
            `${streetName}, ${values.kelurahan}, ${values.subdistrict}, ${cleanedCity}, ${values.province}, Indonesia`
          )
        )
      }
      queries.push(
        finalClean(
          `${values.kelurahan}, ${values.subdistrict}, ${cleanedCity}, ${values.province}, Indonesia`
        )
      )
      queries.push(
        finalClean(`${values.subdistrict}, ${cleanedCity}, ${values.province}, Indonesia`)
      )
      queries.push(finalClean(`${cleanedCity}, ${values.province}, Indonesia`))
      queries.push(finalClean(`${values.province}, Indonesia`))

      const result = await geocodeWithFallbacks(queries)
      if (result) {
        lastGeocodedAddressRef.current = fullAddress
        handleChange({ target: { name: 'latitude', value: result.lat } })
        handleChange({ target: { name: 'longitude', value: result.lng } })
        if (mapInstanceRef.current) {
          initMap(result.lat, result.lng)
        }
      }
    }, 1000)

    return () => clearTimeout(delayDebounceFn)
  }, [
    values.province,
    values.city,
    values.subdistrict,
    values.kelurahan,
    values.addressDetail,
    values.latitude,
    values.longitude,
    initMap,
    handleChange,
  ])

  useEffect(() => {
    const showActiveMap = mapVisible || mapOverrideVisible
    if (showActiveMap && mapRef.current && window.L && !mapInstanceRef.current) {
      const lat = values.latitude || '-6.2088'
      const lng = values.longitude || '106.8456'
      const timer = setTimeout(() => {
        initMap(lat, lng)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [mapVisible, mapOverrideVisible, initMap, values.latitude, values.longitude])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerInstanceRef.current = null
      }
    }
  }, [])

  return (
    <>
      <input type="hidden" name="latitude" value={values.latitude} />
      <input type="hidden" name="longitude" value={values.longitude} />

      {mapVisible || mapOverrideVisible ? (
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
            Peta Lokasi Pengiriman (Google Maps)
          </label>

          <div className="flex gap-2 mb-3">
            <div ref={searchContainerRef} className="flex-grow relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  preventSuggestionsRef.current = false
                  setSearchQuery(e.target.value)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearchLocation()
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false)
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                placeholder="Cari lokasi patokan, nama jalan, atau gedung..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none"
              />

              {showSuggestions && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((item, idx) => (
                    <div
                      key={item.place_id || idx}
                      onClick={() => {
                        preventSuggestionsRef.current = true
                        setSearchQuery(item.display_name)
                        setSuggestions([])
                        setShowSuggestions(false)

                        handleChange({ target: { name: 'latitude', value: item.lat } })
                        handleChange({ target: { name: 'longitude', value: item.lon } })

                        if (mapInstanceRef.current) {
                          initMap(item.lat, item.lon)
                        }
                      }}
                      className="px-4 py-2 text-xs font-body text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors text-left truncate"
                      title={item.display_name}
                    >
                      {item.display_name}
                    </div>
                  ))}
                </div>
              )}

              {isLoadingSuggestions && (
                <div className="absolute right-3 top-[10px] flex items-center">
                  <svg
                    className="animate-spin h-4 w-4 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleSearchLocation}
              className="px-4 py-2 h-[38px] text-xs uppercase tracking-wider whitespace-nowrap"
            >
              Cari
            </Button>
          </div>

          <div
            ref={mapRef}
            className="w-full h-[300px] border border-gray-300 rounded shadow-sm z-0 relative"
            style={{ minHeight: '300px' }}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-[11px] text-gray-500 font-body flex items-center gap-1">
              <Icon name="Info" size={12} className="inline text-gray-400" />
              Silakan seret pin merah jika ingin menentukan titik kirim kurir yang lebih akurat.
            </p>
            {mapOverrideVisible && !mapVisible && (
              <button
                type="button"
                onClick={() => {
                  setMapOverrideVisible(false)
                  handleChange({ target: { name: 'latitude', value: '' } })
                  handleChange({ target: { name: 'longitude', value: '' } })
                }}
                className="text-[11px] text-red-600 hover:text-red-800 font-medium font-body underline"
              >
                Sembunyikan Peta
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <label className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
            Peta Lokasi Pengiriman
          </label>
          <div
            onClick={handleActivateMapManual}
            className="w-full h-[150px] border border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50/50 transition-all duration-200 relative overflow-hidden"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M0 0h80v80H0z' fill='%23fbfbfb'/%3E%3Cpath d='M0 10h80M0 20h80M0 30h80M0 40h80M0 50h80M0 60h80M0 70h80M10 0v80M20 0v80M30 0v80M40 0v80M50 0v80M60 0v80M70 0v80' stroke='%23f3f3f3' stroke-width='1'/%3E%3C/svg%3E")`,
            }}
          >
            <div className="bg-white px-6 py-3 border border-gray-300 rounded shadow-sm hover:shadow-md transition-shadow flex items-center gap-2 text-sm font-heading font-medium text-gray-700 z-10">
              <Icon name="Plus" size={16} className="text-gray-500" />
              Tambah Lokasi
            </div>
          </div>
        </div>
      )}
    </>
  )
}
