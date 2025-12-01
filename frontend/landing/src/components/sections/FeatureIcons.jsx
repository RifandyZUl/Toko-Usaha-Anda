import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import Section from '../common/Section'

/**
 * Feature Icons Section - Keunggulan Toko Usaha Anda
 */
function FeatureIcons() {
  const [ref] = useIntersectionObserver()
  const features = [
    { icon: '🏠', text: 'ALAT RUMAH TANGGA LENGKAP' },
    { icon: '🔧', text: 'PERKAKAS TUKANG PROFESIONAL' },
    { icon: '🏍️', text: 'ALAT MOTOR TERPERCAYA' },
    { icon: '⭐', text: 'KUALITAS TERJAMIN SEJAK 2004' },
    { icon: '💰', text: 'HARGA TERJANGKAU & BERSAING' },
  ]

  return (
    <Section id="feature-icons" ref={ref} className="bg-darkgreen-900 py-12 sm:py-16">
      <div className="container-custom">
        <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-darkgreen-800 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl sm:text-3xl">{feature.icon}</span>
              </div>
              <p className="text-xs sm:text-sm text-beige-200 font-body font-medium uppercase tracking-wider max-w-[150px]">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

export default FeatureIcons
