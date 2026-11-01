import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import {
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPasswordWithToken,
} from '../services/auth.js'

/**
 * ForgotPasswordPage
 * Multi-step secure password reset with Email or WhatsApp OTP verification
 */
function ForgotPasswordPage() {
  const navigate = useNavigate()

  // Steps: 1: IDENTIFIER, 2: OTP, 3: NEW_PASSWORD, 4: SUCCESS
  const [step, setStep] = useState(1)
  const [channel, setChannel] = useState('EMAIL') // 'EMAIL' | 'WHATSAPP'
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [simulatedInfo, setSimulatedInfo] = useState(null)

  // Countdown timer for resend OTP cooldown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Step 1: Request OTP
  const handleRequestOtp = async e => {
    if (e) e.preventDefault()
    setError('')
    setInfoMessage('')

    const cleanId = identifier.trim()
    if (!cleanId) {
      setError(
        channel === 'EMAIL'
          ? 'Silakan masukkan alamat email akun Anda.'
          : 'Silakan masukkan nomor WhatsApp akun Anda.'
      )
      return
    }

    setLoading(true)
    const res = await requestPasswordReset(cleanId, channel)
    setLoading(false)

    if (res.success) {
      setInfoMessage(res.message)
      setCooldown(res.cooldownSeconds || 60)
      if (res.simulated && res.devOtp) {
        setSimulatedInfo({
          otp: res.devOtp,
          target: cleanId,
        })
      } else {
        setSimulatedInfo(null)
      }
      setStep(2)
    } else {
      setError(res.error || 'Gagal mengirim kode reset kata sandi.')
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async e => {
    e.preventDefault()
    setError('')

    const cleanOtp = otp.trim()
    if (cleanOtp.length !== 6) {
      setError('Kode verifikasi harus 6 digit angka.')
      return
    }

    setLoading(true)
    const res = await verifyPasswordResetOtp(identifier.trim(), channel, cleanOtp)
    setLoading(false)

    if (res.success && res.resetToken) {
      setResetToken(res.resetToken)
      setError('')
      setStep(3)
    } else {
      setError(res.error || 'Kode verifikasi tidak valid atau kedaluwarsa.')
    }
  }

  // Step 3: Set New Password
  const handleResetPassword = async e => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      return
    }
    if (!/\d/.test(newPassword)) {
      setError('Kata sandi harus mengandung minimal 1 angka.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }

    setLoading(true)
    const res = await resetPasswordWithToken(resetToken, newPassword)
    setLoading(false)

    if (res.success) {
      setStep(4)
    } else {
      setError(res.error || 'Gagal mengatur ulang kata sandi.')
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white p-10 border border-gray-100 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-6">
              <h1 className="text-xl font-heading font-semibold tracking-tight text-gray-900">
                TOKO USAHA ANDA
              </h1>
            </Link>
            <h2 className="text-2xl font-heading font-medium text-gray-900 mb-2">
              Lupa Kata Sandi
            </h2>
            <p className="text-sm font-body text-gray-600">
              {step === 1 && 'Pilih metode pemulihan untuk menerima kode verifikasi aman.'}
              {step === 2 && 'Masukkan 6 digit kode yang dikirim ke akun Anda.'}
              {step === 3 && 'Buat kata sandi baru yang kuat untuk akun Anda.'}
              {step === 4 && 'Kata sandi akun Anda berhasil diperbarui.'}
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === i ? 'w-8 bg-gray-900' : step > i ? 'w-4 bg-emerald-600' : 'w-4 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 flex items-start gap-2 text-red-600 text-xs">
              <Icon name="AlertCircle" size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Development / Simulation Banner */}
          {simulatedInfo && step === 2 && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded">
              <div className="flex items-center gap-1 font-semibold mb-1">
                <Icon name="Info" size={14} /> Mode Simulasi / Development
              </div>
              Kode OTP reset: <strong className="font-mono text-sm tracking-wider">{simulatedInfo.otp}</strong>
            </div>
          )}

          {/* ─── STEP 1: SELECT CHANNEL & ENTER IDENTIFIER ─── */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* Channel Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg mb-4 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setChannel('EMAIL')
                    setIdentifier('')
                    setError('')
                  }}
                  className={`py-2 rounded-md transition-colors ${
                    channel === 'EMAIL'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Via Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChannel('WHATSAPP')
                    setIdentifier('')
                    setError('')
                  }}
                  className={`py-2 rounded-md transition-colors ${
                    channel === 'WHATSAPP'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Via WhatsApp
                </button>
              </div>

              <div>
                <label
                  htmlFor="identifier"
                  className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider"
                >
                  {channel === 'EMAIL' ? 'Alamat Email' : 'Nomor WhatsApp'}
                </label>
                <input
                  type={channel === 'EMAIL' ? 'email' : 'tel'}
                  id="identifier"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                  placeholder={
                    channel === 'EMAIL' ? 'contoh@gmail.com' : '08123456789 atau 628123456789'
                  }
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="sm"
                disabled={loading}
                className="uppercase tracking-wider text-xs py-2.5"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                    Mengirim Kode...
                  </>
                ) : (
                  'Kirim Kode Verifikasi'
                )}
              </Button>
            </form>
          )}

          {/* ─── STEP 2: VERIFY OTP ─── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {infoMessage && (
                <p className="text-xs text-gray-600 bg-gray-50 p-3 border border-gray-200 rounded">
                  {infoMessage}
                </p>
              )}

              <div>
                <label
                  htmlFor="otp"
                  className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider"
                >
                  Kode OTP (6 Digit)
                </label>
                <input
                  type="text"
                  id="otp"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-center text-lg tracking-[0.5em] font-mono border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                  placeholder="••••••"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="sm"
                disabled={loading || otp.length !== 6}
                className="uppercase tracking-wider text-xs py-2.5"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                    Memverifikasi...
                  </>
                ) : (
                  'Verifikasi Kode'
                )}
              </Button>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setError('')
                  }}
                  className="text-gray-600 hover:text-gray-900 underline underline-offset-2"
                >
                  Ganti {channel === 'EMAIL' ? 'Email' : 'WhatsApp'}
                </button>

                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={cooldown > 0 || loading}
                  className={`underline underline-offset-2 ${
                    cooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900 hover:text-gray-600'
                  }`}
                >
                  {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim Ulang Kode'}
                </button>
              </div>
            </form>
          )}

          {/* ─── STEP 3: NEW PASSWORD ─── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider"
                >
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                  placeholder="Minimal 6 karakter & ada angka"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider"
                >
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                  placeholder="Ulangi kata sandi baru"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="sm"
                disabled={loading}
                className="uppercase tracking-wider text-xs py-2.5"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Kata Sandi Baru'
                )}
              </Button>
            </form>
          )}

          {/* ─── STEP 4: SUCCESS ─── */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Icon name="Check" size={24} />
              </div>
              <p className="text-sm text-gray-700">
                Kata sandi baru berhasil disimpan. Silakan masuk menggunakan kata sandi Anda yang baru.
              </p>
              <Button
                type="button"
                variant="primary"
                fullWidth
                size="sm"
                onClick={() => navigate('/shop/login')}
                className="uppercase tracking-wider text-xs py-2.5"
              >
                Masuk Sekarang
              </Button>
            </div>
          )}

          {/* Back to Login */}
          {step !== 4 && (
            <div className="mt-8 text-center">
              <Link
                to="/shop/login"
                className="inline-flex items-center gap-2 text-xs font-body text-gray-600 hover:text-gray-900 uppercase tracking-wider transition-colors"
              >
                <Icon name="ChevronDown" size={14} className="rotate-90" />
                Kembali ke Halaman Masuk
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
