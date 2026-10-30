/**
 * ProfileInfoTab - Personal details and edit form
 */
export default function ProfileInfoTab({
  user,
  formData,
  isEditing,
  setIsEditing,
  handleInputChange,
  handleSaveProfile,
  setFormData,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-semibold text-gray-900">
          Informasi Akun
        </h2>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-sm font-body text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Edit Profil
          </button>
        )}
      </div>

      <div className="space-y-6 max-w-xl">
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Nama Lengkap
          </label>
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          ) : (
            <p className="text-gray-900 text-sm font-medium">{formData.name || '-'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Email
          </label>
          <p className="text-gray-900 text-sm font-medium">{formData.email || '-'}</p>
          <p className="text-xs text-gray-500 mt-1">
            Email tidak dapat diubah
          </p>
        </div>

        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Nomor Telepon
          </label>
          {isEditing ? (
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          ) : (
            <p className="text-gray-900 text-sm font-medium">{formData.phone || '-'}</p>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleSaveProfile}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-body font-medium hover:bg-primary-700 transition-colors text-sm"
            >
              Simpan Perubahan
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setFormData({
                  name: user?.name || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                  address: user?.address || '',
                })
              }}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-body font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
