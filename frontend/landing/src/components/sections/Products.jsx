import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { PRODUCT_CATEGORIES } from '../../utils/constants'
import Button from '../common/Button'
import { scrollToElement } from '../../utils/scroll'

/**
 * Products section - Nike style: Full-width cards, besar, fokus visual
 */
function Products() {
  const [ref] = useIntersectionObserver()

  // Gambar untuk setiap kategori
  const categoryImages = {
    household:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=800&fit=crop&q=80',
    tools: 'https://i.pinimg.com/1200x/15/6f/c0/156fc01d52452032f7da462707f5a5c6.jpg',
    motorcycle: 'https://i.pinimg.com/736x/39/ea/d2/39ead210b0f155ac1bd523948d00d250.jpg',
  }

  const handleCategoryClick = () => {
    scrollToElement('contact')
  }

  return (
    <section id="products" ref={ref} className="bg-white py-0">
      {/* Section Header - Minimalis */}
      <div className="container-custom text-center py-12 sm:py-16 md:py-24 lg:py-32">
        <h2 className="text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-heading font-black text-black mb-4 tracking-tighter">
          Kategori Produk
        </h2>
      </div>

      {/* Full-width Cards seperti Nike */}
      <div className="w-full">
        {PRODUCT_CATEGORIES.map((category, index) => (
          <div
            key={category.id}
            className={`relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] lg:min-h-[70vh] flex items-center overflow-hidden py-8 sm:py-12 md:py-16 lg:py-0 ${
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            }`}
          >
            <div className="container-custom w-full">
              <div
                className={`grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-16 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-dense' : ''
                }`}
              >
                {/* Image - Full width seperti Nike */}
                <div
                  className={`relative h-[250px] sm:h-[300px] md:h-[400px] lg:h-[500px] xl:h-[600px] overflow-hidden rounded-lg ${
                    index % 2 === 1 ? 'lg:col-start-2' : ''
                  }`}
                >
                  <img
                    src={categoryImages[category.id]}
                    alt={category.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <div
                  className={`flex flex-col justify-center space-y-4 sm:space-y-6 ${
                    index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''
                  }`}
                >
                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-heading font-black text-black tracking-tighter break-words">
                    {category.title}
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-600 font-body font-light leading-relaxed">
                    {category.description}
                  </p>
                  <div className="pt-2 sm:pt-4">
                    <Button
                      onClick={handleCategoryClick}
                      variant="outline"
                      size="lg"
                      className="border-2 border-black text-black hover:bg-black hover:text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg transition-all duration-300 rounded-full w-full sm:w-auto"
                    >
                      Lihat Produk
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Products
