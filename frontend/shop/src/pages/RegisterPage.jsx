import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { useAuthStore } from '../stores/authStore'
import { sendEmailOtp, sendRegisterWaOtp } from '../services/auth'
import Loading from '../components/common/Loading'

/**
 * Register Page with Separated Email & WhatsApp-First Registration Flows (Option A & C)
 */
function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register, isLoading: isRegistering, error: authError, user } = useAuthStore()
  const isAuthenticated = !!user

  // Registration Channel: 'EMAIL' | 'WHATSAPP'
  const [channel, setChannel] = useState('EMAIL')

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
  const [cooldown, setCooldown] = useState(0) // Resend cooldown in seconds (60s)
  const [validityTime, setValidityTime] = useState(0) // OTP validity countdown in seconds (60s)
  const [devOtp, setDevOtp] = useState(null)
  const [formError, setFormError] = useState('')
  const [successInfo, setSuccessInfo] = useState('')

  const cooldownTimerRef = useRef(null)
  const validityTimerRef = useRef(null)
  const otpInputRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/shop'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      cooldownTimerRef.current = setTimeout(() => setCooldown(prev => prev - 1), 1000)
    }
    return () => clearTimeout(cooldownTimerRef.current)
  }, [cooldown])

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

  const handleChannelSwitch = newChannel => {
    if (step === 'OTP') return
    setChannel(newChannel)
    setFormError('')
    setSuccessInfo('')
  }

  const validateCommonFields = () => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setFormError('Nama lengkap minimal 2 karakter.')
      return false
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

  const validateEmailChannel = () => {
    if (!validateCommonFields()) return false
    const cleanEmail = formData.email.trim()
    if (!cleanEmail) {
      setFormError('Alamat email wajib diisi.')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Format alamat email tidak valid (contoh: nama@gmail.com).')
      return false
    }
    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/[-\s()]/g, '')
      if (!/^[0-9]{10,14}$/.test(cleanPhone)) {
        setFormError('Nomor telepon harus antara 10 sampai 14 digit angka.')
        return false
      }
    }
    return true
  }

  const validateWaChannel = () => {
    if (!validateCommonFields()) return false
    const cleanPhone = formData.phone.replace(/[-\s()]/g, '').trim()
    if (!cleanPhone || cleanPhone.length < 10) {
      setFormError('Nomor WhatsApp wajib diisi minimal 10 digit angka.')
      return false
    }
    if (!/^[0-9]{10,14}$/.test(cleanPhone)) {
      setFormError('Format nomor WhatsApp tidak valid. Masukkan hanya angka.')
      return false
    }
    return true
  }

  // Request OTP based on selected channel (Email or WhatsApp)
  const handleRequestOtp = async e => {
    if (e) e.preventDefault()
    setFormError('')

    if (channel === 'EMAIL') {
      if (!validateEmailChannel()) return
      setIsSendingOtp(true)
      try {
        const res = await sendEmailOtp(formData.email.trim())
        if (res && res.success) {
          setStep('OTP')
          setCooldown(res.cooldownSeconds || 60)
          setValidityTime(res.expiresInSeconds || 60)
          setSuccessInfo(res.message || 'Kode verifikasi OTP telah dikirim ke email Anda.')
          if (res.devOtp) setDevOtp(res.devOtp)
        } else {
          setFormError(res?.error || 'Gagal mengirim kode OTP ke email. Silakan coba lagi.')
        }
      } catch (err) {
        setFormError(err.message || 'Terjadi kesalahan jaringan saat mengirim kode OTP.')
      } finally {
        setIsSendingOtp(false)
      }
    } else {
      // WhatsApp Channel
      if (!validateWaChannel()) return
      setIsSendingOtp(true)
      try {
        const cleanPhone = formData.phone.replace(/[-\s()]/g, '').trim()
        const res = await sendRegisterWaOtp(cleanPhone)
        if (res && res.success) {
          setStep('OTP')
          setCooldown(res.cooldownSeconds || 60)
          setValidityTime(res.expiresInSeconds || 60)
          setSuccessInfo(res.message || `Kode verifikasi OTP telah dikirim ke nomor WhatsApp (${cleanPhone}).`)
          if (res.devOtp) setDevOtp(res.devOtp)
        } else {
          setFormError(res?.error || 'Gagal mengirim kode OTP ke WhatsApp. Silakan coba lagi.')
        }
      } catch (err) {
        setFormError(err.message || 'Terjadi kesalahan jaringan saat mengirim OTP ke WhatsApp.')
      } finally {
        setIsSendingOtp(false)
      }
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || isSendingOtp) return
    await handleRequestOtp()
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
      setFormError('Kode OTP telah kedaluwarsa. Silakan klik "Kirim Ulang Kode".')
      return
    }

    const payload = {
      channel,
      name: formData.name.trim(),
      password: formData.password,
      otp: otpCode.trim(),
      ...(channel === 'EMAIL'
        ? {
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim() || undefined,
          }
        : {
            phone: formData.phone.replace(/[-\s()]/g, '').trim(),
            ...(formData.email.trim() ? { email: formData.email.trim().toLowerCase() } : {}),
          }),
    }

    const result = await register(payload)

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
          <div className="text-center mb-6">
            <Link to="/" className="inline-block mb-3">
              <h1 className="text-xl font-heading font-semibold tracking-tight text-gray-900">
                TOKO USAHA ANDA
              </h1>
            </Link>
            <h2 className="text-2xl font-heading font-medium text-gray-900 mb-1">
              {step === 'FORM'
                ? 'Buat Akun Baru'
                : channel === 'WHATSAPP'
                ? 'Verifikasi WhatsApp'
                : 'Verifikasi Email'}
            </h2>
            <p className="text-xs font-body text-gray-600">
              {step === 'FORM'
                ? 'Pilih metode pendaftaran yang Anda inginkan'
                : channel === 'WHATSAPP'
                ? `Masukkan 6 digit kode OTP yang dikirim ke WhatsApp ${formData.phone}`
                : `Masukkan 6 digit kode OTP yang dikirim ke email ${formData.email}`}
            </p>
          </div>

          {/* Registration Channel Tabs (Only in FORM step) */}
          {step === 'FORM' && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg mb-6 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleChannelSwitch('EMAIL')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-md transition-all cursor-pointer ${
                  channel === 'EMAIL'
                    ? 'bg-white text-gray-950 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon name="Mail" size={15} />
                <span>Via Email</span>
              </button>
              <button
                type="button"
                onClick={() => handleChannelSwitch('WHATSAPP')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-md transition-all cursor-pointer ${
                  channel === 'WHATSAPP'
                    ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon name="MessageSquare" size={15} />
                <span>Via WhatsApp</span>
              </button>
            </div>
          )}

          {/* Error Message */}
          {(formError || authError) && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2 text-red-600">
                <Icon name="AlertCircle" size={17} className="shrink-0 mt-0.5" />
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
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-md">
              <div className="flex items-start gap-2 text-emerald-700">
                <Icon name="CheckCircle" size={17} className="shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{successInfo}</p>
              </div>
            </div>
          )}

          {/* Dev Simulation Badge */}
          {devOtp && step === 'OTP' && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-md flex items-center justify-between">
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
                  className="block text-xs font-body font-medium text-gray-900 mb-1 uppercase tracking-wider"
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

              {channel === 'EMAIL' ? (
                <>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-body font-medium text-gray-900 mb-1 uppercase tracking-wider"
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
                      Kode OTP 6 digit akan dikirimkan ke email ini untuk diverifikasi.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-body font-medium text-gray-900 mb-1 uppercase tracking-wider"
                    >
                      Nomor HP <span className="text-gray-400 font-normal lowercase">(opsional)</span>
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
                </>
              ) : (
                /* WhatsApp Channel */
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-body font-medium text-gray-900 mb-1 uppercase tracking-wider"
                  >
                    Nomor WhatsApp
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-emerald-300 rounded focus:border-emerald-700 focus:outline-none transition-colors"
                    placeholder="081234567890"
                    required
                    disabled={isSendingOtp}
                  />
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Kode verifikasi OTP 6 digit akan dikirimkan langsung ke nomor WhatsApp ini.
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-body font-medium text-gray-900 mb-1 uppercase tracking-wider"
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
                  className="block text-xs font-body font-medium text-gray-900 mb-1 uppercase tracking-wider"
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
                className="uppercase tracking-wider text-xs px-4 py-2 mt-5"
              >
                {isSendingOtp ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                    Mengirim Kode OTP...
                  </>
                ) : channel === 'EMAIL' ? (
                  'Lanjut Verifikasi Email'
                ) : (
                  'Lanjut Verifikasi WhatsApp'
                )}
              </Button>
            </form>
          ) : (
            /* STEP 2: Strict OTP Verification Form */
            <form onSubmit={handleVerifyAndRegister} className="space-y-5">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 mb-1.5">
                  <Icon
                    name={channel === 'WHATSAPP' ? 'MessageSquare' : 'Mail'}
                    size={16}
                    className={channel === 'WHATSAPP' ? 'text-emerald-700' : 'text-gray-700'}
                  />
                  <span>
                    Kode verifikasi dikirim ke {channel === 'WHATSAPP' ? 'WhatsApp:' : 'Email:'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 font-mono break-all">
                  {channel === 'WHATSAPP' ? formData.phone : formData.email}
                </p>

                {/* Validity Countdown */}
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

              {/* Resend and Edit Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-gray-100 text-xs">
                <button
                  type="button"
                  disabled={cooldown > 0 || isSendingOtp}
                  onClick={handleResendOtp}
                  className="text-gray-800 hover:text-black underline font-medium disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  <Icon name="RotateCcw" size={13} />
                  {cooldown > 0
                    ? `Kirim ulang (${cooldown}s)`
                    : channel === 'WHATSAPP'
                    ? 'Kirim Ulang Kode WA'
                    : 'Kirim Ulang Kode Email'}
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
                  Ubah Data / Ganti Jalur
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
