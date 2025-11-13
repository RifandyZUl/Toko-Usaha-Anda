import { useState } from 'react'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { useForm } from '../../hooks/useForm'
import { validateContactForm } from '../../utils/validators'
import { CONTACT_INFO } from '../../utils/constants'
import Section from '../common/Section'
import Card from '../common/Card'
import Button from '../common/Button'
import Icon from '../common/Icon'
import Notification from '../common/Notification'

/**
 * Contact section component dengan design modern
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      console.log('Form data:', values)
      
      // Show success notification
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
    <Section id="contact" ref={ref}>
      <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-14">
        <h2 className="text-[28px] sm:text-[32px] md:text-[38px] lg:text-[44px] font-heading font-bold text-gray-900 mb-3 sm:mb-4">
          Hubungi Kami
        </h2>
        <p className="text-[14px] sm:text-[16px] md:text-[18px] text-gray-600 max-w-3xl font-body font-normal leading-relaxed">
          Kami siap membantu kebutuhan Anda
        </p>
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 transition-all duration-700 ${
          hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Contact Info */}
        <div className="space-y-4 sm:space-y-6">
          {CONTACT_INFO.map((info, index) => (
            <div
              key={index}
              className={`transition-all duration-500 ${
                hasIntersected
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-10'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Card className="hover:translate-x-2 hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md">
                    <Icon name={info.icon} size={20} className="sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-heading-2 font-heading font-semibold text-gray-900 mb-2 sm:mb-4">
                      {info.title}
                    </h3>
                    <p className="text-sm sm:text-body-md text-gray-600 whitespace-pre-line font-body">
                      {info.content}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div
          className={`transition-all duration-700 ${
            hasIntersected
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-10'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          <Card className="border border-gray-100 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm sm:text-body-md font-body font-semibold text-gray-900 mb-1.5 sm:mb-2"
                >
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Masukkan nama Anda"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.name && touched.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                />
                {errors.name && touched.name && (
                  <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm sm:text-body-md font-body font-semibold text-gray-900 mb-1.5 sm:mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="nama@email.com"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.email && touched.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                />
                {errors.email && touched.email && (
                  <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm sm:text-body-md font-body font-semibold text-gray-900 mb-1.5 sm:mb-2"
                >
                  No. Telepon
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={values.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0812-3456-7890"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.phone && touched.phone
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                />
                {errors.phone && touched.phone && (
                  <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* Message Field */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm sm:text-body-md font-body font-semibold text-gray-900 mb-1.5 sm:mb-2"
                >
                  Pesan
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={values.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows="5"
                  placeholder="Tulis pesan Anda di sini..."
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 resize-vertical ${
                    errors.message && touched.message
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                />
                {errors.message && touched.message && (
                  <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                disabled={isSubmitting}
                className="shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Pesan'}
              </Button>

              {/* Submit Error */}
              {errors.submit && (
                <p className="text-sm text-red-500 text-center">
                  {errors.submit}
                </p>
              )}
            </form>
          </Card>
        </div>
      </div>

      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() =>
          setNotification({ ...notification, isVisible: false })
        }
      />
    </Section>
  )
}

export default Contact
