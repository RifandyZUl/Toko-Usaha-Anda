import { useState } from 'react'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { MapPin, Clock, Phone, Map, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import showroomImg from '../../assets/Toko.webp'
import {
  CONTACT_PHONE,
  CONTACT_ADDRESS,
  CONTACT_MAPS_URL,
  CONTACT_HOURS,
  API_BASE_URL,
} from '../../utils/constants'
import { validateContactForm } from '../../utils/validators'

function Contact() {
  const [ref, hasIntersected] = useIntersectionObserver()

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [serverError, setServerError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)

    // Client-side validation
    const formErrors = validateContactForm(formData)
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          comment: formData.message.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSubmitSuccess(true)
        setFormData({ name: '', email: '', phone: '', message: '' })
        setErrors({})
      } else {
        setServerError(data.error || data.message || 'Gagal mengirim pesan. Silakan coba lagi.')
      }
    } catch {
      setServerError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" ref={ref} className="py-24 md:py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Showroom Details & Location */}
          <div
            className={`space-y-10 transition-all duration-1000 transform ${
              hasIntersected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <div>
              <p className="font-sans font-semibold text-[11px] tracking-[0.25em] text-griya-secondary uppercase mb-2">
                Showroom & Kantor
              </p>
              <h2 className="font-serif text-3xl md:text-5xl text-griya-primary">
                Kunjungi Toko Kami
              </h2>
            </div>

            <div className="overflow-hidden border border-griya-outline/20 h-[300px] md:h-[350px]">
              <img
                src={showroomImg}
                alt="Toko Usaha Anda Showroom"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-[10000ms] ease-out"
                loading="lazy"
              />
            </div>

            <div className="space-y-6">
              {/* Address */}
              <div className="flex items-start gap-4">
                <MapPin className="text-griya-secondary shrink-0 mt-0.5" size={20} strokeWidth={1.5} />
                <div>
                  <p className="font-sans font-semibold text-[11px] tracking-[0.2em] text-griya-primary uppercase mb-1">
                    Alamat Toko
                  </p>
                  <p className="font-sans text-[13px] md:text-sm text-griya-muted leading-relaxed max-w-sm">
                    {CONTACT_ADDRESS}
                  </p>
                </div>
              </div>

              {/* Operations */}
              <div className="flex items-start gap-4">
                <Clock className="text-griya-secondary shrink-0 mt-0.5" size={20} strokeWidth={1.5} />
                <div>
                  <p className="font-sans font-semibold text-[11px] tracking-[0.2em] text-griya-primary uppercase mb-1">
                    Jam Operasional
                  </p>
                  <p className="font-sans text-[13px] md:text-sm text-griya-muted leading-relaxed max-w-sm">
                    {CONTACT_HOURS}
                  </p>
                </div>
              </div>

              {/* Phone/WA */}
              <div className="flex items-start gap-4">
                <Phone className="text-griya-secondary shrink-0 mt-0.5" size={20} strokeWidth={1.5} />
                <div>
                  <p className="font-sans font-semibold text-[11px] tracking-[0.2em] text-griya-primary uppercase mb-1">
                    Telepon & WhatsApp
                  </p>
                  <p className="font-sans text-[13px] md:text-sm text-griya-muted leading-relaxed max-w-sm">
                    {CONTACT_PHONE}
                  </p>
                </div>
              </div>
            </div>

            {/* Google Maps CTA */}
            <div>
              <a
                href={CONTACT_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#2C2724] text-white px-8 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-griya-secondary transition-colors duration-300"
              >
                <Map size={14} /> BUKA PETA GOOGLE MAPS
              </a>
            </div>
          </div>

          {/* Right Column - Interactive Contact Form */}
          <div
            className={`bg-[#FAFAF9] p-8 md:p-12 border border-griya-outline/30 transition-all duration-1000 delay-200 transform ${
              hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="mb-8">
              <p className="font-sans font-semibold text-[11px] tracking-[0.25em] text-griya-secondary uppercase mb-2">
                Formulir Pertanyaan
              </p>
              <h3 className="font-serif text-2xl md:text-4xl text-griya-primary">
                Kirim Pesan ke Kami
              </h3>
              <p className="font-sans text-xs md:text-sm text-griya-muted mt-2 leading-relaxed">
                Punya pertanyaan tentang produk, grosir, atau pemesanan khusus? Tinggalkan pesan, tim kami akan merespons secepat mungkin.
              </p>
            </div>

            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-6 p-5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Pesan Anda Berhasil Terkirim!</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Terima kasih telah menghubungi Toko Usaha Anda. Tim kami akan segera menanggapi melalui WhatsApp atau Email Anda.
                  </p>
                </div>
              </div>
            )}

            {/* Server Error Message */}
            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="contact-name"
                  className="block font-sans font-semibold text-[11px] tracking-[0.15em] text-griya-primary uppercase mb-2"
                >
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-sm font-sans bg-white border ${
                    errors.name ? 'border-red-400' : 'border-griya-outline/40'
                  } focus:border-griya-primary focus:outline-none transition-colors`}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1 font-sans">{errors.name}</p>
                )}
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block font-sans font-semibold text-[11px] tracking-[0.15em] text-griya-primary uppercase mb-2"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 text-sm font-sans bg-white border ${
                      errors.email ? 'border-red-400' : 'border-griya-outline/40'
                    } focus:border-griya-primary focus:outline-none transition-colors`}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1 font-sans">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block font-sans font-semibold text-[11px] tracking-[0.15em] text-griya-primary uppercase mb-2"
                  >
                    No. WhatsApp / HP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contact-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 text-sm font-sans bg-white border ${
                      errors.phone ? 'border-red-400' : 'border-griya-outline/40'
                    } focus:border-griya-primary focus:outline-none transition-colors`}
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1 font-sans">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="contact-message"
                  className="block font-sans font-semibold text-[11px] tracking-[0.15em] text-griya-primary uppercase mb-2"
                >
                  Pesan atau Pertanyaan <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-sm font-sans bg-white border ${
                    errors.message ? 'border-red-400' : 'border-griya-outline/40'
                  } focus:border-griya-primary focus:outline-none transition-colors resize-none`}
                  disabled={isSubmitting}
                />
                {errors.message && (
                  <p className="text-xs text-red-500 mt-1 font-sans">{errors.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#2C2724] hover:bg-griya-secondary text-white py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.25em] transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
              >
                {isSubmitting ? (
                  <span>MENGIRIM PESAN...</span>
                ) : (
                  <>
                    <Send size={14} /> KIRIM PESAN SEKARANG
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
