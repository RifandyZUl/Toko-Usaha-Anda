import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { PRODUCT_CATEGORIES } from '../../utils/constants'
import Section from '../common/Section'
import Card from '../common/Card'
import Button from '../common/Button'
import Icon from '../common/Icon'
import { scrollToElement } from '../../utils/scroll'

/**
 * Products section component dengan design modern
 */
function Products() {
  const [ref, hasIntersected] = useIntersectionObserver()

  const handleButtonClick = () => {
    scrollToElement('contact')
  }

  return (
    <Section id="products" alternate ref={ref}>
      <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-14">
        <h2 className="text-[28px] sm:text-[32px] md:text-[38px] lg:text-[44px] font-heading font-bold text-gray-900 mb-3 sm:mb-4">
          Kategori Produk Kami
        </h2>
        <p className="text-[14px] sm:text-[16px] md:text-[18px] text-gray-600 max-w-3xl font-body font-normal leading-relaxed">
          Pilih kategori yang Anda butuhkan untuk menemukan produk terbaik
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {PRODUCT_CATEGORIES.map((category, index) => (
          <div
            key={category.id}
            className={`transition-all duration-700 ${
              hasIntersected
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            <Card className="h-full flex flex-col group relative overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100">
              {/* Gradient Top Border */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${category.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />

              <div className="flex flex-col items-center text-center flex-grow p-6 sm:p-8">
                {/* Icon dengan gradient background */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon name={category.icon} size={32} className="text-white sm:w-10 sm:h-10" />
                </div>

                <h3 className="text-lg sm:text-heading-3 font-heading font-bold text-gray-900 mb-3 sm:mb-5 group-hover:text-primary-600 transition-colors">
                  {category.title}
                </h3>
                
                <p className="text-sm sm:text-body-md text-gray-600 mb-6 sm:mb-8 flex-grow font-body">
                  {category.description}
                </p>

                {/* Features List */}
                <ul className="w-full text-left mb-4 sm:mb-6 space-y-2 sm:space-y-3">
                  {category.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="text-sm sm:text-body-md text-gray-700 flex items-center gap-2 font-body"
                    >
                      <Icon name="CheckCircle" size={16} className="sm:w-[18px] sm:h-[18px] text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={handleButtonClick}
                  variant="outline"
                  fullWidth
                  className="mt-auto group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all"
                >
                  Lihat Katalog
                </Button>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </Section>
  )
}

export default Products
