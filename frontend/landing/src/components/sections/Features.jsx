import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import {
  Wallet,
  CheckCircle,
  Truck,
  MessageCircle,
  ShieldCheck,
  Star
} from 'lucide-react'

function Features() {
  const [ref, hasIntersected] = useIntersectionObserver()

  const benefits = [
    {
      title: 'KUALITAS TERBAIK',
      description: 'Menyediakan produk dengan standar mutu tinggi dan tahan lama untuk segala kebutuhan.',
      icon: CheckCircle,
    },
    {
      title: 'HARGA TERJANGKAU',
      description: 'Dapatkan produk premium dengan penawaran harga yang bersahabat di kantong.',
      icon: Wallet,
    },
    {
      title: 'PENGIRIMAN AMAN',
      description: 'Layanan pengiriman yang cepat dan aman hingga sampai di lokasi Anda.',
      icon: Truck,
    },
    {
      title: 'PELAYANAN PERSONAL',
      description: 'Tim support kami siap memberikan rekomendasi produk yang tepat untuk Anda.',
      icon: MessageCircle,
    },
    {
      title: 'GARANSI RESMI',
      description: 'Setiap produk bergaransi memberikan ketenangan pikiran dalam penggunaannya.',
      icon: ShieldCheck,
    },
    {
      title: 'TERPERCAYA',
      description: 'Telah dipercaya oleh ribuan pelanggan yang puas dengan layanan kami.',
      icon: Star,
    },
  ]

  return (
    <section
      id="features"
      ref={ref}
      className="py-24 md:py-32 bg-griya-surface-low"
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl text-griya-primary">
            Kenapa Memilih Toko Usaha Anda?
          </h2>
          <p className="font-sans text-sm md:text-base text-griya-muted mt-4 max-w-2xl mx-auto">
            Kami memberikan layanan dan produk unggulan sehingga Anda tidak perlu khawatir tentang kualitasnya.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon
            return (
              <div
                key={index}
                className={`flex flex-col items-center text-center p-8 md:p-10 bg-white border border-griya-outline/20 hover:border-griya-outline/50 transition-all duration-700 transform ${
                  hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="shrink-0 w-14 h-14 bg-griya-surface-low text-griya-secondary flex items-center justify-center rounded-full mb-6">
                  <IconComponent size={24} strokeWidth={1.5} />
                </div>
                <h3 className="font-sans font-semibold text-[11px] tracking-[0.2em] text-griya-primary mb-3 uppercase">
                  {benefit.title}
                </h3>
                <p className="font-sans text-[13px] text-griya-muted leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Features
