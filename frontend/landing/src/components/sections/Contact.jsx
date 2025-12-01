import { useState } from 'react'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { useForm } from '../../hooks/useForm'
import { validateContactForm } from '../../utils/validators'
import { CONTACT_INFO } from '../../utils/constants'
import Section from '../common/Section'
import Button from '../common/Button'
import Icon from '../common/Icon'
import Notification from '../common/Notification'

/**
 * Contact section - Nike style: Simple, clean, minimalis
 */
function Contact() {
  const [ref, hasIntersected] = useIntersectionObserver()
  const [notification, setNotification] = useState({
    isVisible: false,
    message: '',
    type: 'success',
  })

  const onSubmit = async (values) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      console.log('Form data:', values)
      setNotification({
        isVisible: true,
        message: 'Pesan berhasil dikirim! Kami akan menghubungi Anda segera.',
        type: 'success',
      })
    } catch (error) {
      setNotification({
        isVisible: true,
        message: 'Terjadi kesalahan. Silakan coba lagi atau hubungi kami langsung.',
        type: 'error',
      })
      throw error
    }
  }

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm(
    {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
    validateContactForm,
    onSubmit
  )

  return (
    <Section id="contact" ref={ref} className="bg-white py-24 sm:py-32">
      {/* Section Header - Minimalis */}
      <div className="container-custom text-center mb-10 sm:mb-12 md:mb-16 lg:mb-24">
        <h2 className="text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-heading font-black text-black mb-4 tracking-tighter">
          Hubungi Kami
        </h2>
      </div>

      <div
        className={`container-custom max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-20 transition-all duration-700 ${
          hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Contact Info - Simple */}
        <div className="space-y-6 sm:space-y-8">
          {CONTACT_INFO.map((info, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                <Icon name={info.icon} size={24} className="text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-semibold text-black mb-2">
                  {info.title}
                </h3>
                <p className="text-base text-gray-600 font-body whitespace-pre-line">
                  {info.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form - Clean */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                id="name"
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nama Lengkap"
                className={`w-full px-4 py-4 text-base border-b-2 border-gray-200 focus:outline-none focus:border-black transition-all duration-300 bg-transparent ${
                  errors.name && touched.name ? 'border-red-500' : ''
                }`}
              />
              {errors.name && touched.name && (
                <p className="mt-2 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <input
                type="email"
                id="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Email"
                className={`w-full px-4 py-4 text-base border-b-2 border-gray-200 focus:outline-none focus:border-black transition-all duration-300 bg-transparent ${
                  errors.email && touched.email ? 'border-red-500' : ''
                }`}
              />
              {errors.email && touched.email && (
                <p className="mt-2 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={values.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="No. Telepon"
                className={`w-full px-4 py-4 text-base border-b-2 border-gray-200 focus:outline-none focus:border-black transition-all duration-300 bg-transparent ${
                  errors.phone && touched.phone ? 'border-red-500' : ''
                }`}
              />
              {errors.phone && touched.phone && (
                <p className="mt-2 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div>
              <textarea
                id="message"
                name="message"
                value={values.message}
                onChange={handleChange}
                onBlur={handleBlur}
                rows="5"
                placeholder="Pesan"
                className={`w-full px-4 py-4 text-base border-b-2 border-gray-200 focus:outline-none focus:border-black transition-all duration-300 resize-none bg-transparent ${
                  errors.message && touched.message ? 'border-red-500' : ''
                }`}
              />
              {errors.message && touched.message && (
                <p className="mt-2 text-sm text-red-500">{errors.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={isSubmitting}
              className="bg-black hover:bg-gray-900 text-white font-semibold py-5 text-lg rounded-full mt-8"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Pesan'}
            </Button>
          </form>
        </div>
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
    </Section>
  )
}

export default Contact
