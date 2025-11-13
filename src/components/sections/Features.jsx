import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { FEATURES } from '../../utils/constants'
import Section from '../common/Section'
import Icon from '../common/Icon'

/**
 * Features section component dengan design modern
 */
function Features() {
  const [ref, hasIntersected] = useIntersectionObserver()

  return (
    <Section id="features" ref={ref}>
      <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-14">
        <h2 className="text-[28px] sm:text-[32px] md:text-[38px] lg:text-[44px] font-heading font-bold text-gray-900 mb-3 sm:mb-4">
          Mengapa Pilih Kami?
        </h2>
        <p className="text-[14px] sm:text-[16px] md:text-[18px] text-gray-600 max-w-3xl font-body font-normal leading-relaxed">
          Keunggulan yang membuat kami berbeda dan terpercaya
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {FEATURES.map((feature, index) => (
          <div
            key={index}
            className={`group p-6 sm:p-8 rounded-2xl border border-gray-200 bg-white hover:border-primary-300 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${
              hasIntersected
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            {/* Icon Container */}
            <div className={`w-12 h-12 sm:w-14 sm:h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
              <Icon name={feature.icon} size={24} className="sm:w-7 sm:h-7" />
            </div>

            <h3 className="text-lg sm:text-heading-4 font-heading font-semibold text-gray-900 mb-3 sm:mb-5 group-hover:text-primary-600 transition-colors">
              {feature.title}
            </h3>
            
            <p className="text-sm sm:text-body-md text-gray-600 font-body">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  )
}

export default Features
