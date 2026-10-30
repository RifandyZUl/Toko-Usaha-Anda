import { useState, useEffect, useRef } from 'react'
import Icon from '@shared/components/Icon.jsx'
import { sendOtp, verifyOtp } from '../services/auth'
import { checkCodEligibility } from '../services/orders'

/**
 * Modern & Clean COD Verification Component
 * Protects against fake orders with WhatsApp OTP verification and COD Guard rules.
 */
export default function CodVerificationSection({
  shippingPhone = '',
  onPhoneChange,
  orderTotal,
  isPhoneVerified,
  onPhoneVerified,
  onResetVerification,
  onEligibilityChange,
}) {
  const [eligibility, setEligibility] = useState({ eligible: true, message: '', isPhoneVerified: false })
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [countdown, setCountdown] = useState(0) // Resend cooldown in seconds
  const [validityCountdown, setValidityCountdown] = useState(0) // OTP validity in seconds (5 min)
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [devOtp, setDevOtp] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const phoneInputRef = useRef(null)
  const timerRef = useRef(null)
  const validityTimerRef = useRef(null)
  const prevPhoneRef = useRef(shippingPhone)

  const onEligibilityChangeRef = useRef(onEligibilityChange)
  onEligibilityChangeRef.current = onEligibilityChange

  const onPhoneVerifiedRef = useRef(onPhoneVerified)
  onPhoneVerifiedRef.current = onPhoneVerified

  // Reset OTP state whenever phone changes
  useEffect(() => {
    if (prevPhoneRef.current !== shippingPhone) {
      prevPhoneRef.current = shippingPhone
      setOtpSent(false)
      setOtpCode('')
      setDevOtp(null)
      setValidityCountdown(0)
      setErrorMessage('')
      setSuccessMessage('')
    }
  }, [shippingPhone])

  // Cooldown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(prev => prev - 1), 1000)
    }
    return () => clearTimeout(timerRef.current)
  }, [countdown])

  // Expiration timer for OTP validity (5 minutes)
  useEffect(() => {
    if (validityCountdown > 0) {
      validityTimerRef.current = setTimeout(() => setValidityCountdown(prev => prev - 1), 1000)
    }
    return () => clearTimeout(validityTimerRef.current)
  }, [validityCountdown])

  // Check COD eligibility when phone or order total changes
  useEffect(() => {
    const phone = (shippingPhone || '').trim()
    if (!phone || phone.length < 8) {
      setEligibility({ eligible: true, message: '', isPhoneVerified: false })
      onEligibilityChangeRef.current?.({ eligible: true })
      return
    }

    let isMounted = true
    const timer = setTimeout(async () => {
      try {
        const res = await checkCodEligibility(phone, orderTotal)
        if (!isMounted) return

        if (res && res.success) {
          setEligibility(res)
          onEligibilityChangeRef.current?.(res)
          if (res.isPhoneVerified) {
            onPhoneVerifiedRef.current?.(phone)
          }
        }
      } catch (err) {
        console.error('Error checking COD eligibility:', err)
      }
    }, 400)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [shippingPhone, orderTotal])

  // Send OTP
  const handleSendOtp = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    const currentPhone = (shippingPhone || '').trim()
    if (!currentPhone || currentPhone.length < 8) {
      setErrorMessage('Harap masukkan nomor WhatsApp penerima (minimal 8 digit, contoh: 081234567890).')
      phoneInputRef.current?.focus()
      return
    }

    setErrorMessage('')
    setIsSending(true)

    try {
      const res = await sendOtp(currentPhone)
      if (res && res.success) {
        setOtpSent(true)
        setCountdown(res.cooldownSeconds || 60)
        setValidityCountdown(res.expiresInSeconds || 300)
        setSuccessMessage(res.message || 'Kode OTP berhasil dikirimkan ke WhatsApp Anda.')
        if (res.devOtp) {
          setDevOtp(res.devOtp)
          setOtpCode(res.devOtp)
        }
      } else {
        setErrorMessage(res?.error || 'Gagal mengirim kode OTP. Silakan periksa koneksi dan coba lagi.')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengirim kode OTP.')
    } finally {
      setIsSending(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    const currentPhone = (shippingPhone || '').trim()
    if (!otpCode || otpCode.trim().length < 6) {
      setErrorMessage('Harap masukkan 6 digit kode OTP.')
      return
    }

    setErrorMessage('')
    setIsVerifying(true)

    try {
      const res = await verifyOtp(currentPhone, otpCode.trim())
      if (res.success) {
        setSuccessMessage('Nomor WhatsApp berhasil diverifikasi!')
        setDevOtp(null)
        onPhoneVerifiedRef.current?.(currentPhone)
        setEligibility(prev => ({ ...prev, isPhoneVerified: true }))
        onEligibilityChangeRef.current?.({ ...eligibility, isPhoneVerified: true })
      } else {
        setErrorMessage(res?.error || 'Kode OTP tidak cocok atau sudah kedaluwarsa.')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memverifikasi OTP.')
    } finally {
      setIsVerifying(false)
    }
  }

  // 1. Ineligible for COD
  if (!eligibility.eligible) {
    return (
      <div className="mt-4 p-5 rounded-xl border border-amber-200 bg-amber-50/80 shadow-sm transition-all">
        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <Icon name="AlertCircle" size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-heading font-semibold text-amber-900">
              Metode COD Tidak Tersedia
            </p>
            <p className="text-xs font-body text-amber-800 mt-1 leading-relaxed">
              {eligibility.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 2. Phone is already verified
  if (isPhoneVerified) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Icon name="CheckCircle" size={18} />
          </div>
          <div>
            <p className="text-xs font-heading font-semibold text-emerald-900">
              Nomor WhatsApp Terverifikasi
            </p>
            <p className="text-xs font-body text-emerald-700 mt-0.5">
              Nomor <span className="font-semibold font-mono">{shippingPhone}</span> siap untuk pesanan COD
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onResetVerification?.()}
            className="text-xs text-emerald-800 hover:text-emerald-950 underline font-medium cursor-pointer"
          >
            Ganti Nomor
          </button>
          <span className="text-[11px] font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
            Siap Checkout
          </span>
        </div>
      </div>
    )
  }

  // 3. Needs WhatsApp OTP verification
  return (
    <div id="cod-verification-panel" className="mt-4 p-5 rounded-xl border border-gray-200 bg-white shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Icon name="ShieldCheck" size={18} />
          </div>
          <div>
            <h4 className="text-sm font-heading font-semibold text-gray-900">
              Verifikasi WhatsApp (COD)
            </h4>
            <p className="text-xs text-gray-500 font-body">
              Wajib untuk keamanan pengiriman pesanan bayar di tempat
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          Belum Verifikasi
        </span>
      </div>

      {/* Phone Number Input & Kirim OTP Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200 mb-3">
        <div className="flex-1">
          <label className="block text-[11px] font-body text-gray-600 mb-1">
            Nomor WhatsApp Penerima:
          </label>
          <div className="relative">
            <input
              ref={phoneInputRef}
              type="tel"
              value={shippingPhone || ''}
              onChange={(e) => {
                setErrorMessage('')
                onPhoneChange?.(e.target.value)
              }}
              placeholder="Contoh: 081234567890"
              className="w-full px-3 py-1.5 text-sm font-mono font-semibold bg-white border border-gray-300 rounded-md focus:border-emerald-500 focus:outline-none text-gray-900"
            />
          </div>
        </div>

        {!otpSent && (
          <div className="sm:self-end">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSending}
              className="w-full sm:w-auto px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            >
              <Icon name="MessageCircle" size={16} />
              <span>{isSending ? 'Mengirim OTP...' : 'Kirim OTP via WhatsApp'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Dev Mode Notification with 1-click Auto-Fill */}
      {devOtp && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold">[Simulasi Dev]</span>
            <span>Kode OTP Anda:</span>
            <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-amber-300">
              {devOtp}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOtpCode(devOtp)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
          >
            Isi Otomatis
          </button>
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-red-600 font-body mb-3">{errorMessage}</p>
      )}

      {successMessage && !errorMessage && (
        <p className="text-xs text-emerald-600 font-body mb-3">{successMessage}</p>
      )}

      {/* OTP Input Form */}
      {otpSent && (
        <div className="pt-2 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-body">Masukkan 6 digit kode OTP:</span>
            {validityCountdown > 0 ? (
              <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                ⏱️ Berlaku {Math.floor(validityCountdown / 60)}:{(validityCountdown % 60).toString().padStart(2, '0')}
              </span>
            ) : (
              <span className="font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                ⚠️ Kode Kedaluwarsa
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-36 h-10 px-3 bg-white border-2 border-gray-300 focus:border-emerald-500 focus:outline-none rounded-lg text-center font-mono text-base font-bold tracking-widest text-gray-900 shadow-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isVerifying || otpCode.length < 6 || validityCountdown === 0}
              className="h-10 px-5 bg-gray-900 hover:bg-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              {isVerifying ? 'Memverifikasi...' : 'Verifikasi OTP'}
            </button>

            <button
              type="button"
              disabled={countdown > 0 || isSending}
              onClick={handleSendOtp}
              className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-50 underline font-body ml-2 cursor-pointer"
            >
              {countdown > 0 ? `Kirim ulang (${countdown}s)` : 'Kirim Ulang'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
