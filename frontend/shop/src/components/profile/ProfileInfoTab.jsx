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
  const activeUser = user?.user || user
  const isWhatsAppUser = Boolean(
    activeUser?.isPhoneVerified || activeUser?.email?.endsWith('@whatsapp.user')
  )
  const isDummyEmail = activeUser?.email?.endsWith('@whatsapp.user')

  const resetForm = () => {
    setIsEditing(false)
    setFormData({
      name: activeUser?.name || '',
      email: isDummyEmail ? '' : (activeUser?.email || ''),
      phone: activeUser?.phone || '',
      address: activeUser?.address || '',
    })
  }

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
        {/* Nama Lengkap */}
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

        {/* Email */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-body font-medium text-gray-700">
              Email
            </label>
            {isWhatsAppUser && (!formData.email || formData.email.endsWith('@whatsapp.user')) && (
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Wajib untuk transaksi
              </span>
            )}
          </div>
          {isWhatsAppUser ? (
            // Akun WhatsApp: Email wajib ditambahkan untuk transaksi
            isEditing ? (
              <>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  Email wajib diisi agar Anda dapat melakukan transaksi pesanan.
                </p>
              </>
            ) : (
              <>
                {formData.email && !formData.email.endsWith('@whatsapp.user') ? (
                  <p className="text-gray-900 text-sm font-medium">{formData.email}</p>
                ) : (
                  <p className="text-gray-400 text-sm italic">Belum ditambahkan</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.email && !formData.email.endsWith('@whatsapp.user')
                    ? 'Klik Edit Profil untuk mengubah email.'
                    : 'Klik Edit Profil untuk menambahkan email (wajib untuk transaksi).'}
                </p>
              </>
            )
          ) : (
            // Akun Email: Email adalah kredensial login utama, tidak dapat diubah
            <>
              <p className="text-gray-900 text-sm font-medium">{formData.email || '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
            </>
          )}
        </div>

        {/* Nomor Telepon / WhatsApp */}
        <div>
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Nomor Telepon {isWhatsAppUser ? '(WhatsApp)' : ''}
          </label>
          {isWhatsAppUser ? (
            // Akun WhatsApp: Nomor WhatsApp adalah kredensial login utama, tidak dapat diubah
            <>
              <p className="text-gray-900 text-sm font-medium">{formData.phone || '-'}</p>
              <p className="text-xs text-gray-500 mt-1">
                Nomor WhatsApp merupakan identitas utama akun Anda dan tidak dapat diubah
              </p>
            </>
          ) : (
            // Akun Email: Nomor telepon opsional & dapat diisi/diubah
            isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            ) : (
              <p className="text-gray-900 text-sm font-medium">{formData.phone || '-'}</p>
            )
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
              onClick={resetForm}
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
