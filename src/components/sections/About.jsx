import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import Section from '../common/Section'
import Icon from '../common/Icon'

/**
 * About section component dengan design modern
 */
function About() {
  const [ref, hasIntersected] = useIntersectionObserver()

  return (
    <Section id="about" alternate ref={ref}>
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center transition-all duration-700 ${
          hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* About Content */}
        <div className="space-y-6 sm:space-y-8">
          <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-14">
            <h2 className="text-[28px] sm:text-[32px] md:text-[38px] lg:text-[44px] font-heading font-bold text-gray-900 mb-3 sm:mb-4">
              Tentang Kami
            </h2>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <p className="text-sm sm:text-body-lg text-gray-600 font-body mb-4 sm:mb-6">
              <strong className="text-gray-900 font-semibold">3 Macam 10.000</strong> adalah
              toko terpercaya yang menyediakan berbagai kebutuhan alat rumah
              tangga, perkakas tukang, dan alat motor dengan kualitas terbaik
              dan harga yang terjangkau.
            </p>
            <p className="text-sm sm:text-body-lg text-gray-600 font-body">
              Dengan pengalaman bertahun-tahun melayani ribuan pelanggan, kami
              berkomitmen untuk memberikan produk berkualitas dan layanan
              terbaik. Visi kami adalah menjadi partner terpercaya untuk semua
              kebutuhan rumah tangga, konstruksi, dan otomotif Anda.
            </p>

            {/* Values */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
              <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <Icon name="Award" size={20} className="sm:w-6 sm:h-6 text-white" />
                </div>
                <h4 className="text-lg sm:text-heading-3 font-heading font-bold text-gray-900 mb-2 sm:mb-4">
                  Visi
                </h4>
                <p className="text-sm sm:text-body-md text-gray-600 font-body">
                  Menjadi toko terdepan yang menyediakan semua kebutuhan dengan
                  kualitas terbaik
                </p>
              </div>
              <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <Icon name="Target" size={20} className="sm:w-6 sm:h-6 text-white" />
                </div>
                <h4 className="text-lg sm:text-heading-3 font-heading font-bold text-gray-900 mb-2 sm:mb-4">
                  Misi
                </h4>
                <p className="text-sm sm:text-body-md text-gray-600 font-body">
                  Memberikan produk berkualitas dengan harga terjangkau dan
                  layanan prima
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* About Visual */}
        <div className="flex justify-center items-center mt-8 lg:mt-0">
            <div className="relative w-full max-w-md">
              {/* Main Card */}
              <div className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-gray-900 rounded-3xl shadow-2xl p-8 sm:p-10 md:p-12 transform hover:scale-105 transition-transform duration-300">
              <div className="text-center text-white space-y-4 sm:space-y-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto">
                  <Icon name="Building2" size={40} className="sm:w-12 sm:h-12 text-white" />
                </div>
                <div>
                  <p className="text-2xl sm:text-heading-1 font-heading font-bold mb-2 sm:mb-3">Toko Kami</p>
                  <p className="text-sm sm:text-body-lg text-white/90 font-body">Melayani dengan sepenuh hati</p>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 bg-accent-400 rounded-full blur-2xl opacity-30" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 sm:w-24 sm:h-24 bg-secondary-400 rounded-full blur-2xl opacity-30" />
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

export default About
