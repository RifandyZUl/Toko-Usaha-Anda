import Icon from '@shared/components/Icon.jsx'
import CheckoutMapPicker from '../checkout/CheckoutMapPicker'

/**
 * ProfileAddressTab - Shipping address preview and edit form with cascading regions and map
 */
export default function ProfileAddressTab({
  user,
  addressForm,
  setAddressForm,
  isEditingAddress,
  setIsEditingAddress,
  handleAddressInputChange,
  handleSaveAddress,
  provinces = [],
  cities = [],
  subdistricts = [],
  villages = [],
  fetchCities,
  fetchSubdistricts,
  fetchVillages,
  setCities,
  setSubdistricts,
  setVillages,
  fetchPostalCode,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-semibold text-gray-900">
          Alamat Pengiriman Saya
        </h2>
        {!isEditingAddress && (
          <button
            type="button"
            onClick={() => setIsEditingAddress(true)}
            className="text-sm font-body text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            {addressForm.addressDetail ? 'Edit Alamat' : 'Tambah Alamat'}
          </button>
        )}
      </div>

      {isEditingAddress ? (
        <div className="space-y-6 max-w-3xl">
          {/* Map Location Section */}
          <CheckoutMapPicker values={addressForm} handleChange={handleAddressInputChange} />

          {/* Receiver and Phone Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Nama Penerima
              </label>
              <input
                type="text"
                name="receiverName"
                value={addressForm.receiverName}
                onChange={handleAddressInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                placeholder="Nama penerima paket"
              />
            </div>
            <div>
              <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Nomor Telepon Penerima
              </label>
              <input
                type="tel"
                name="shippingPhone"
                value={addressForm.shippingPhone}
                onChange={handleAddressInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                placeholder="Contoh: 0812345678"
              />
            </div>
          </div>

          {/* Detail Address */}
          <div>
            <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              Detail Alamat (Nama Jalan, No. Rumah, RT/RW)
            </label>
            <textarea
              name="addressDetail"
              value={addressForm.addressDetail}
              onChange={handleAddressInputChange}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none"
              placeholder="Contoh: Jl. Merpati No. 12 RT 04/RW 02"
            />
          </div>

          {/* Region Select List Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Province */}
            <div>
              <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Provinsi
              </label>
              <select
                name="province"
                value={addressForm.province}
                onChange={e => {
                  const selectedOption = e.target.options[e.target.selectedIndex]
                  const id = selectedOption.getAttribute('data-id')
                  handleAddressInputChange(e)

                  if (id) fetchCities(id)
                  setCities([])
                  setSubdistricts([])
                  setVillages([])
                  setAddressForm(prev => ({
                    ...prev,
                    city: '',
                    subdistrict: '',
                    kelurahan: '',
                    postalCode: '',
                  }))
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white appearance-none"
              >
                <option value="" data-id="">
                  Pilih Provinsi
                </option>
                {provinces.map(prov => (
                  <option key={prov.id} value={prov.name} data-id={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Kota / Kabupaten
              </label>
              <select
                name="city"
                value={addressForm.city}
                onChange={e => {
                  const selectedOption = e.target.options[e.target.selectedIndex]
                  const id = selectedOption.getAttribute('data-id')
                  handleAddressInputChange(e)

                  if (id) fetchSubdistricts(id)
                  setSubdistricts([])
                  setVillages([])
                  setAddressForm(prev => ({
                    ...prev,
                    subdistrict: '',
                    kelurahan: '',
                    postalCode: '',
                  }))
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white appearance-none"
                disabled={cities.length === 0}
              >
                <option value="" data-id="">
                  Pilih Kota/Kabupaten
                </option>
                {cities.map(city => (
                  <option key={city.id} value={city.name} data-id={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Region Select List Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subdistrict */}
            <div>
              <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Kecamatan
              </label>
              <select
                name="subdistrict"
                value={addressForm.subdistrict}
                onChange={e => {
                  const selectedOption = e.target.options[e.target.selectedIndex]
                  const id = selectedOption.getAttribute('data-id')
                  handleAddressInputChange(e)

                  if (id) fetchVillages(id)
                  setVillages([])
                  setAddressForm(prev => ({
                    ...prev,
                    kelurahan: '',
                    postalCode: '',
                  }))
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white appearance-none"
                disabled={subdistricts.length === 0}
              >
                <option value="" data-id="">
                  Pilih Kecamatan
                </option>
                {subdistricts.map(sub => (
                  <option key={sub.id} value={sub.name} data-id={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Kelurahan / Village */}
            <div>
              <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Kelurahan / Desa
              </label>
              <select
                name="kelurahan"
                value={addressForm.kelurahan}
                onChange={e => {
                  handleAddressInputChange(e)
                  if (e.target.value && addressForm.subdistrict) {
                    fetchPostalCode(e.target.value, addressForm.subdistrict)
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white appearance-none"
                disabled={villages.length === 0}
              >
                <option value="">Pilih Kelurahan</option>
                {villages.map(vil => (
                  <option key={vil.id} value={vil.name}>
                    {vil.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Postal Code */}
            <div>
              <label className="block text-xs font-body font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Kode Pos
              </label>
              <input
                type="text"
                name="postalCode"
                value={addressForm.postalCode}
                onChange={handleAddressInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                placeholder="Kode Pos"
              />
            </div>
          </div>

          {/* Edit Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleSaveAddress}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-body font-medium hover:bg-primary-700 transition-colors text-sm"
            >
              Simpan Alamat
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditingAddress(false)
                let parsed = {
                  receiverName: user?.name || '',
                  shippingPhone: user?.phone || '',
                  addressDetail: '',
                  province: '',
                  city: '',
                  subdistrict: '',
                  kelurahan: '',
                  postalCode: '',
                  latitude: '',
                  longitude: '',
                }
                if (user?.address) {
                  try {
                    const parsedAddress = JSON.parse(user.address)
                    parsed = {
                      receiverName: parsedAddress.receiverName || user.name || '',
                      shippingPhone: parsedAddress.shippingPhone || user.phone || '',
                      addressDetail: parsedAddress.addressDetail || '',
                      province: parsedAddress.province || '',
                      city: parsedAddress.city || '',
                      subdistrict: parsedAddress.subdistrict || '',
                      kelurahan: parsedAddress.kelurahan || '',
                      postalCode: parsedAddress.postalCode || '',
                      latitude: parsedAddress.latitude || '',
                      longitude: parsedAddress.longitude || '',
                    }
                  } catch (e) {
                    parsed.addressDetail = user.address
                  }
                }
                setAddressForm(parsed)
              }}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-body font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div>
          {addressForm.addressDetail ? (
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 font-body uppercase tracking-wider">
                    Nama Penerima
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {addressForm.receiverName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-body uppercase tracking-wider">
                    Nomor Telepon
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {addressForm.shippingPhone}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-400 font-body uppercase tracking-wider">
                  Alamat Pengiriman Lengkap
                </p>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                  {addressForm.addressDetail}
                  <br />
                  Kel. {addressForm.kelurahan}, Kec. {addressForm.subdistrict}
                  <br />
                  {addressForm.city}, {addressForm.province}
                  <br />
                  KODE POS:{' '}
                  <span className="font-semibold text-gray-900">{addressForm.postalCode}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon name="MapPin" size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4 font-body">
                Belum ada alamat pengiriman terperinci tersimpan.
              </p>
              <button
                type="button"
                onClick={() => setIsEditingAddress(true)}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-body font-medium hover:bg-primary-700 transition-colors text-sm"
              >
                Tambah Alamat Baru
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
