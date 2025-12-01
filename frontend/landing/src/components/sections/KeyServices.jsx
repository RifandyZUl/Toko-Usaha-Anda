import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import Section from '../common/Section'
import Icon from '../common/Icon'

/**
 * Key Services Section seperti Karigari - dark green dengan 4 circular icons
 */
function KeyServices() {
  const [ref, hasIntersected] = useIntersectionObserver()

  const services = [
    {
      icon: 'Truck',
      title: 'Gratis Ongkir & Retur',
      description: 'Pengiriman gratis untuk pembelian di atas minimum tertentu dengan kebijakan retur yang mudah',
    },
    {
      icon: 'DollarSign',
      title: 'Garansi Uang Kembali',
      description: 'Kepuasan Anda adalah prioritas kami dengan jaminan uang kembali jika tidak puas',
    },
    {
      icon: 'Headphones',
      title: 'Dukungan Online 24/7',
      description: 'Tim customer service kami siap membantu Anda kapan saja, setiap hari',
    },
    {
      icon: 'Tag',
      title: 'Penawaran Reguler',
      description: 'Nikmati diskon dan penawaran spesial secara berkala untuk produk pilihan',
    },
  ]

  return (
    <Section id="key-services" ref={ref} className="bg-darkgreen-900 py-16 sm:py-20 md:py-24">
      {/* Section Header dengan Icon K */}
      <div className="text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-darkgreen-800 rounded-full mb-4">
          <span className="text-3xl font-bold text-white">K</span>
        </div>
        <p className="text-sm sm:text-base text-beige-200 uppercase tracking-wider mb-2 font-body">
          LAYANAN UTAMA KAMI
        </p>
        <h2 className="text-[36px] sm:text-[42px] md:text-[48px] lg:text-[56px] font-heading font-bold text-white">
          Solusi Sempurna untuk Kebutuhan Anda
        </h2>
      </div>

      {/* Grid 4 Services */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
        {services.map((service, index) => (
          <div
            key={index}
            className={`text-center transition-all duration-700 ${
              hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            {/* Circular Icon */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-darkgreen-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg hover:scale-110 transition-transform duration-300">
              <Icon name={service.icon} size={40} className="text-beige-200" />
            </div>
            
            <h3 className="text-lg sm:text-xl font-heading font-bold text-white mb-3">
              {service.title}
            </h3>
            
            <p className="text-sm sm:text-base text-beige-200 font-body leading-relaxed">
              {service.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  )
}

export default KeyServices

