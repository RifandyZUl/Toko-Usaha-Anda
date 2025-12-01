import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { FEATURES } from '../../utils/constants'
import Section from '../common/Section'
import Icon from '../common/Icon'

/**
 * Features section component dengan cards elegan seperti Compatto
 */
function Features() {
  const [ref, hasIntersected] = useIntersectionObserver()

  return (
    <Section id="features" ref={ref} className="bg-white">
      <div className="mb-10 sm:mb-12 md:mb-16">
        <h2 className="text-[32px] sm:text-[38px] md:text-[44px] lg:text-[52px] font-heading font-bold text-brown-900 mb-4 sm:mb-6">
          Mengapa Pilih Kami?
        </h2>
        <p className="text-[16px] sm:text-[18px] md:text-[20px] text-brown-700 max-w-3xl font-body font-normal leading-relaxed">
          Keunggulan yang membuat kami berbeda dan terpercaya
        </p>
      </div>

      {/* Grid Features seperti Compatto - 2x3 layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {FEATURES.map((feature, index) => (
          <div
            key={index}
            className={`group relative p-8 sm:p-10 rounded-2xl bg-beige-50 border border-beige-200 hover:border-brown-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
              hasIntersected
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            {/* Icon Container - Elegan seperti Compatto */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brown-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brown-700 group-hover:scale-110 transition-all duration-300 shadow-lg">
              <Icon name={feature.icon} size={32} className="text-beige-100" />
            </div>

            <h3 className="text-xl sm:text-2xl font-heading font-bold text-brown-900 mb-4 group-hover:text-brown-700 transition-colors">
              {feature.title}
            </h3>
            
            <p className="text-base sm:text-lg text-brown-600 font-body leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  )
}

export default Features
