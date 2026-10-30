import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { useAuthStore } from '../stores/authStore'
import { sendEmailOtp, sendRegisterWaOtp } from '../services/auth'
import Loading from '../components/Loading'

/**
 * Register Page with Email & WhatsApp OTP Verification (1-minute validity)
 */
function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register, isLoading: isRegistering, error: authError, user } = useAuthStore()
  const isAuthenticated = !!user

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  // OTP Verification Flow State
  const [step, setStep] = useState('FORM') // 'FORM' | 'OTP'
  const [otpCode, setOtpCode] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isSendingWaOtp, setIsSendingWaOtp] = useState(false)
  const [activeOtpChannel, setActiveOtpChannel] = useState('EMAIL') // 'EMAIL' | 'WHATSAPP'
  const [showWaInput, setShowWaInput] = useState(false)
  const [waPhoneInput, setWaPhoneInput] = useState('')
  const [emailCooldown, setEmailCooldown] = useState(0) // Email resend cooldown
  const [waCooldown, setWaCooldown] = useState(0) // WhatsApp resend cooldown
  const [validityTime, setValidityTime] = useState(0) // OTP validity countdown in seconds (60s = 1m)
  const [devOtp, setDevOtp] = useState(null)
  const [formError, setFormError] = useState('')
  const [successInfo, setSuccessInfo] = useState('')

  const emailCooldownTimerRef = useRef(null)
  const waCooldownTimerRef = useRef(null)
  const validityTimerRef = useRef(null)
  const otpInputRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/shop'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  // Email cooldown timer
  useEffect(() => {
    if (emailCooldown > 0) {
      emailCooldownTimerRef.current = setTimeout(() => setEmailCooldown(prev => prev - 1), 1000)
    }
    return () => clearTimeout(emailCooldownTimerRef.current)
  }, [emailCooldown])

  // WhatsApp cooldown timer
  useEffect(() => {
    if (waCooldown > 0) {
      waCooldownTimerRef.current = setTimeout(() => setWaCooldown(prev => prev - 1), 1000)
    }
    return () => clearTimeout(waCooldownTimerRef.current)
  }, [waCooldown])

  // Validity countdown for OTP expiration
  useEffect(() => {
    if (validityTime > 0) {
      validityTimerRef.current = setTimeout(() => setValidityTime(prev => prev - 1), 1000)
    }
    return () => clearTimeout(validityTimerRef.current)
  }, [validityTime])

  // Auto-focus OTP input when entering OTP step
  useEffect(() => {
    if (step === 'OTP') {
      otpInputRef.current?.focus()
    }
  }, [step])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const validateForm = () => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setFormError('Nama lengkap minimal 2 karakter.')
      return false
    }
    if (!formData.email.trim()) {
      setFormError('Alamat email wajib diisi.')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setFormError('Format alamat email tidak valid (contoh: nama@gmail.com).')
      return false
    }
    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/[-\s()]/g, '')
      if (!/^[0-9]{10,13}$/.test(cleanPhone)) {
        setFormError('Nomor telepon harus antara 10 sampai 13 digit angka.')
        return false
      }
    }
    if (!formData.password) {
      setFormError('Kata sandi wajib diisi.')
      return false
    }
    if (formData.password.length < 6) {
      setFormError('Kata sandi minimal 6 karakter.')
      return false
    }
    if (!/\d/.test(formData.password)) {
      setFormError('Kata sandi harus mengandung minimal satu angka.')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Konfirmasi kata sandi tidak cocok.')
      return false
    }
    return true
  }

  // Request Email OTP
  const handleRequestOtp = async e => {
    if (e) e.preventDefault()
    setFormError('')

    if (!validateForm()) return

    setIsSendingOtp(true)
    try {
      const res = await sendEmailOtp(formData.email.trim())
      if (res && res.success) {
        setStep('OTP')
        setActiveOtpChannel('EMAIL')
        setEmailCooldown(res.cooldownSeconds || 60)
        setValidityTime(res.expiresInSeconds || 60) // 1 menit
        setSuccessInfo(res.message || 'Kode verifikasi OTP telah dikirim ke email Anda.')
        if (res.devOtp) {
          setDevOtp(res.devOtp)
        }
      } else {
        setFormError(res?.error || 'Gagal mengirim kode OTP ke email. Silakan coba lagi.')
      }
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan jaringan saat mengirim kode OTP.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  // Fallback: Send OTP via WhatsApp
  const handleSendWaOtp = async phoneToUse => {
    setFormError('')
    const targetPhone = (phoneToUse || formData.phone || waPhoneInput || '').trim()
    const cleanPhone = targetPhone.replace(/[-\s()]/g, '')

    if (!cleanPhone || cleanPhone.length < 9) {
      setFormError('Nomor WhatsApp tidak valid (minimal 10 digit).')
      setShowWaInput(true)
      return
    }

    setIsSendingWaOtp(true)
    try {
      const res = await sendRegisterWaOtp(formData.email.trim(), cleanPhone)
      if (res && res.success) {
        setValidityTime(res.expiresInSeconds || 60) // 1 menit
        setWaCooldown(res.cooldownSeconds || 60)
        setFormData(prev => ({ ...prev, phone: targetPhone }))
        setActiveOtpChannel('WHATSAPP')
        setShowWaInput(false)
        setSuccessInfo(res.message || `Kode OTP berhasil dikirim ke nomor WhatsApp (${cleanPhone}).`)
        if (res.devOtp) {
          setDevOtp(res.devOtp)
        }
        otpInputRef.current?.focus()
      } else {
        setFormError(res?.error || 'Gagal mengirim kode OTP ke WhatsApp. Silakan coba lagi.')
      }
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan jaringan saat mengirim OTP ke WhatsApp.')
    } finally {
      setIsSendingWaOtp(false)
    }
  }

  // Submit Final Registration with OTP
  const handleVerifyAndRegister = async e => {
    if (e) e.preventDefault()
    setFormError('')

    if (!otpCode || otpCode.trim().length !== 6) {
      setFormError('Harap masukkan 6 digit kode OTP yang dikirimkan.')
      return
    }

    if (validityTime === 0) {
      setFormError('Kode OTP telah kedaluwarsa. Silakan klik tombol "Kirim Ulang Kode".')
      return
    }

    const result = await register({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || undefined,
      password: formData.password,
      otp: otpCode.trim(),
    })

    if (result.success) {
      const from = location.state?.from?.pathname || '/shop'
      navigate(from, { replace: true })
    } else {
      if (result.errors && result.errors.length > 0) {
        setFormError(result.errors[0].message)
      } else {
        setFormError(result.error || 'Pendaftaran gagal. Periksa kembali kode OTP Anda.')
      }
    }
  }

  const formatMinutes = seconds => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (isAuthenticated) {
    return <Loading message="Mengarahkan..." />
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 sm:p-10 border border-gray-200/70 shadow-sm rounded-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <h1 className="text-xl font-heading font-semibold tracking-tight text-gray-900">
                TOKO USAHA ANDA
              </h1>
            </Link>
            <h2 className="text-2xl font-heading font-medium text-gray-900 mb-1">
              {step === 'FORM'
                ? 'Buat Akun Baru'
                : activeOtpChannel === 'WHATSAPP'
                ? 'Verifikasi WhatsApp'
                : 'Verifikasi Email'}
            </h2>
            <p className="text-sm font-body text-gray-600">
              {step === 'FORM'
                ? 'Daftar dengan email aktif untuk verifikasi akun'
                : activeOtpChannel === 'WHATSAPP'
                ? `Masukkan kode OTP yang dikirim ke nomor WhatsApp ${formData.phone}`
                : `Masukkan kode OTP yang dikirim ke ${formData.email}`}
            </p>
          </div>

          {/* Error Message */}
          {(formError || authError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2.5 text-red-600">
                <Icon name="AlertCircle" size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">
                  {formError ||
                    (typeof authError === 'string'
                      ? authError
                      : authError?.message || 'Terjadi kesalahan')}
                </p>
              </div>
            </div>
          )}

          {/* Success / Info Message */}
          {successInfo && !formError && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-md">
              <div className="flex items-start gap-2.5 text-emerald-700">
                <Icon name="CheckCircle" size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{successInfo}</p>
              </div>
            </div>
          )}

          {/* Dev Simulation Badge */}
          {devOtp && step === 'OTP' && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">[Simulasi Dev]</span>
                <span>Kode:</span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-300">
                  {devOtp}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOtpCode(devOtp)}
                className="font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                Isi Otomatis
              </button>
            </div>
          )}

          {/* STEP 1: Registration Form */}
          {step === 'FORM' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-body font-medium text-gray-900 mb-1.5 uppercase tracking-wider"
                >
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-gray-900 focus:outline-none transition-colors"
                  placeholder="Nama lengkap Anda"
                  required
                  disabled={isSendingOtp}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-body font-medium text-gray-900 mb-1.5 uppercase tracking-wider"
                >
                  Alamat Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-gray-900 focus:outline-none transition-colors"
                  placeholder="contoh@gmail.com"
                  required
                  disabled={isSendingOtp}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Kode verifikasi OTP 6 digit akan dikirimkan ke email ini.
                </p>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-body font-medium text-gray-900 mb-1.5 uppercase tracking-wider"
                >
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-gray-900 focus:outline-none transition-colors"
                  placeholder="081234567890"
                  disabled={isSendingOtp}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-body font-medium text-gray-900 mb-1.5 uppercase tracking-wider"
                >
                  Kata Sandi
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-gray-900 focus:outline-none transition-colors"
                  placeholder="Min. 6 karakter, kombinasi angka"
                  required
                  disabled={isSendingOtp}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-body font-medium text-gray-900 mb-1.5 uppercase tracking-wider"
                >
                  Konfirmasi Kata Sandi
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-gray-900 focus:outline-none transition-colors"
                  placeholder="Ulangi kata sandi"
                  required
                  disabled={isSendingOtp}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="sm"
                disabled={isSendingOtp}
                className="uppercase tracking-wider text-xs px-4 py-2 mt-6"
              >
                {isSendingOtp ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                    Mengirim Kode OTP...
                  </>
                ) : (
                  'Lanjutkan'
                )}
              </Button>
            </form>
          ) : (
            /* STEP 2: OTP Verification Form */
            <form onSubmit={handleVerifyAndRegister} className="space-y-5">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 mb-2">
                  <Icon
                    name={activeOtpChannel === 'WHATSAPP' ? 'MessageSquare' : 'Mail'}
                    size={16}
                    className={activeOtpChannel === 'WHATSAPP' ? 'text-emerald-700' : 'text-gray-700'}
                  />
                  <span>
                    Kode dikirim ke {activeOtpChannel === 'WHATSAPP' ? 'WhatsApp:' : 'Email:'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 font-mono break-all">
                  {activeOtpChannel === 'WHATSAPP' ? formData.phone : formData.email}
                </p>

                {/* Validity Timer Display (1 Minute) */}
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-white shadow-xs">
                  {validityTime > 0 ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Masa berlaku kode:{' '}
                      <strong className="font-mono">{formatMinutes(validityTime)}</strong>
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      ⚠️ Kode OTP telah kedaluwarsa
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="otpCode"
                  className="block text-xs font-body font-medium text-gray-900 mb-2 text-center uppercase tracking-wider"
                >
                  Masukkan 6 Digit Kode OTP
                </label>
                <div className="flex justify-center">
                  <input
                    ref={otpInputRef}
                    type="text"
                    id="otpCode"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => {
                      setFormError('')
                      setOtpCode(e.target.value.replace(/[^0-9]/g, ''))
                    }}
                    placeholder="000000"
                    className="w-48 h-12 text-center font-mono text-2xl font-bold tracking-[0.4em] border-2 border-gray-300 focus:border-gray-900 focus:outline-none rounded-lg shadow-sm"
                    disabled={isRegistering}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="sm"
                disabled={isRegistering || otpCode.length !== 6 || validityTime === 0}
                className="uppercase tracking-wider text-xs px-4 py-2 mt-4"
              >
                {isRegistering ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                    Memverifikasi & Membuat Akun...
                  </>
                ) : (
                  'Verifikasi & Buat Akun'
                )}
              </Button>

              {/* Opsi Aktivitas: Kirim Kode ke WhatsApp jika belum terima email */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-md shrink-0 mt-0.5">
                    <Icon name="MessageSquare" size={16} />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-emerald-950 mb-0.5">
                      {activeOtpChannel === 'WHATSAPP'
                        ? 'Kirim Ulang ke WhatsApp?'
                        : 'Tidak menerima kode di email?'}
                    </p>
                    <p className="text-emerald-800/90 leading-relaxed mb-2.5">
                      {activeOtpChannel === 'WHATSAPP'
                        ? 'Anda dapat meminta kode baru dikirimkan kembali ke nomor WhatsApp Anda.'
                        : 'Kirimkan kode OTP verifikasi 6 digit langsung ke nomor WhatsApp Anda.'}
                    </p>

                    {formData.phone && !showWaInput ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isSendingWaOtp || waCooldown > 0}
                          onClick={() => handleSendWaOtp(formData.phone)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isSendingWaOtp ? (
                            <>
                              <Icon name="Loader2" size={13} className="animate-spin" />
                              Mengirim ke WhatsApp...
                            </>
                          ) : waCooldown > 0 ? (
                            <>
                              <Icon name="Clock" size={13} />
                              Kirim ulang WA ({waCooldown}s)
                            </>
                          ) : (
                            <>
                              <Icon name="Send" size={13} />
                              Kirim Kode ke WA ({formData.phone})
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setWaPhoneInput(formData.phone)
                            setShowWaInput(true)
                          }}
                          className="text-[11px] text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                        >
                          Ganti Nomor WA
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-1.5">
                          <input
                            type="tel"
                            value={waPhoneInput}
                            onChange={e => setWaPhoneInput(e.target.value)}
                            placeholder="Nomor WA (contoh: 081234567890)"
                            className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                          />
                          <button
                            type="button"
                            disabled={isSendingWaOtp || waCooldown > 0 || !waPhoneInput.trim()}
                            onClick={() => handleSendWaOtp(waPhoneInput)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded text-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            {isSendingWaOtp ? (
                              <>
                                <Icon name="Loader2" size={12} className="animate-spin" />
                                Mengirim...
                              </>
                            ) : waCooldown > 0 ? (
                              `Tunggu (${waCooldown}s)`
                            ) : (
                              'Kirim ke WA'
                            )}
                          </button>
                        </div>
                        {formData.phone && (
                          <button
                            type="button"
                            onClick={() => setShowWaInput(false)}
                            className="text-[11px] text-gray-500 hover:text-gray-700 underline"
                          >
                            Batal ganti nomor
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resend and Edit Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                <button
                  type="button"
                  disabled={emailCooldown > 0 || isSendingOtp || isSendingWaOtp}
                  onClick={handleRequestOtp}
                  className="text-gray-700 hover:text-gray-900 underline font-medium disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  {emailCooldown > 0 ? `Kirim ulang via email (${emailCooldown}s)` : 'Kirim Ulang via Email'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('FORM')
                    setOtpCode('')
                    setFormError('')
                    setSuccessInfo('')
                  }}
                  className="text-gray-500 hover:text-gray-800 underline cursor-pointer"
                >
                  Ubah Email / Data
                </button>
              </div>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-sm font-body text-gray-600">
              Sudah punya akun?{' '}
              <Link
                to="/shop/login"
                className="text-gray-900 hover:text-gray-600 font-medium underline underline-offset-2"
              >
                Masuk di Sini
              </Link>
            </p>
          </div>

          {/* Back to Shop */}
          <div className="mt-4 text-center">
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-body text-gray-500 hover:text-gray-900 uppercase tracking-wider transition-colors"
            >
              <Icon name="ChevronDown" size={14} className="rotate-90" />
              Kembali ke Toko
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
