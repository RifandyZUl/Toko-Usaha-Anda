import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { Star } from 'lucide-react'

function Testimonials() {
  const [ref, hasIntersected] = useIntersectionObserver()

  const reviews = [
    {
      name: 'Andini Saputri',
      role: 'Ibu Rumah Tangga',
      initials: 'AS',
      text: '"Belanja alat dapur di Toko Usaha Anda memuaskan. Sapu dan perlengkapan lainnya kokoh dan awet. Pengiriman ke luar kota juga rapi sekali packingnya. Sangat recommended!"',
      rating: 5,
    },
    {
      name: 'Reza Wijaya',
      role: 'Kontraktor',
      initials: 'RW',
      text: '"Sebagai kontraktor, saya selalu cari perkakas di sini. Kualitas palu, obeng, dan alat tukangnya jempolan, sangat kuat dan pas untuk kebutuhan di lapangan tiap harinya."',
      rating: 5,
    },
    {
      name: 'Bambang Pamungkas',
      role: 'Wirausaha',
      initials: 'BP',
      text: '"Sparepart motornya lengkap. Pengirimannya super cepat, sangat recommended buat yang mau servis mandiri. CS-nya juga sangat komunikatif dan sabar saat ditanya."',
      rating: 5,
    },
  ]

  return (
    <section
      id="testimoni"
      ref={ref}
      className="py-24 md:py-32 bg-griya-surface-low"
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl text-griya-primary">
            Apa Kata Mereka?
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {reviews.map((review, index) => (
            <div
              key={index}
              className={`bg-white p-8 md:p-10 border border-griya-outline/20 hover:border-griya-outline/50 transition-all duration-1000 transform ${
                hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Rating stars */}
              <div className="flex gap-1.5 text-griya-secondary mb-6">
                {[...Array(review.rating)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="fill-griya-secondary text-griya-secondary"
                  />
                ))}
              </div>

              {/* Testimonial text */}
              <p className="font-sans text-[13px] md:text-sm text-griya-muted mb-10 leading-relaxed min-h-[80px]">
                {review.text}
              </p>

              {/* User profile */}
              <div className="flex items-center gap-4 border-t border-griya-outline/20 pt-6">
                <div className="w-10 h-10 bg-griya-surface-low rounded-full flex items-center justify-center text-griya-primary font-serif text-sm border border-griya-outline/10">
                  {review.initials}
                </div>
                <div>
                  <h4 className="font-sans font-semibold text-[11px] tracking-[0.1em] text-griya-primary uppercase">
                    {review.name}
                  </h4>
                  <p className="font-sans text-[10px] text-griya-muted tracking-wider mt-0.5 uppercase">
                    {review.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
