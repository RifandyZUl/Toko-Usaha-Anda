import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { MapPin, Clock, Phone, Map } from 'lucide-react'
import showroomImg from '../../assets/Toko.png'
import { CONTACT_PHONE, CONTACT_ADDRESS, CONTACT_MAPS_URL, CONTACT_HOURS } from '../../utils/constants'

function Contact() {
  const [ref, hasIntersected] = useIntersectionObserver()

  return (
    <section id="contact" ref={ref} className="py-24 md:py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Showroom Image */}
          <div
            className={`overflow-hidden border border-griya-outline/20 h-[450px] transition-all duration-1000 transform ${
              hasIntersected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <img
              src={showroomImg}
              alt="Toko Usaha Anda Showroom"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-[15000ms] ease-out"
              loading="lazy"
            />
          </div>

          {/* Right Column - Contact Details */}
          <div
            className={`transition-all duration-1000 delay-200 transform ${
              hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="font-serif text-3xl md:text-5xl text-griya-primary mb-10">
              Kunjungi Toko Kami
            </h2>

            <div className="space-y-8 mb-10">
              {/* Address */}
              <div className="flex items-start gap-4">
                <MapPin className="text-griya-secondary shrink-0" size={24} strokeWidth={1.5} />
                <div>
                  <p className="font-sans font-semibold text-[11px] tracking-[0.2em] text-griya-primary uppercase mb-1">
                    Alamat Toko
                  </p>
                  <p className="font-sans text-[13px] md:text-sm text-griya-muted leading-relaxed max-w-sm">
                    {CONTACT_ADDRESS}
                  </p>
                </div>
              </div>

              {/* Operations */}
              <div className="flex items-start gap-4">
                <Clock className="text-griya-secondary shrink-0" size={24} strokeWidth={1.5} />
                <div>
                  <p className="font-sans font-semibold text-[11px] tracking-[0.2em] text-griya-primary uppercase mb-1">
                    Jam Operasional
                  </p>
                  <p className="font-sans text-[13px] md:text-sm text-griya-muted leading-relaxed max-w-sm">
                    {CONTACT_HOURS}
                  </p>
                </div>
              </div>

              {/* Phone/WA */}
              <div className="flex items-start gap-4">
                <Phone className="text-griya-secondary shrink-0" size={24} strokeWidth={1.5} />
                <div>
                  <p className="font-sans font-semibold text-[11px] tracking-[0.2em] text-griya-primary uppercase mb-1">
                    Hubungi Kami
                  </p>
                  <p className="font-sans text-[13px] md:text-sm text-griya-muted leading-relaxed max-w-sm">
                    {CONTACT_PHONE}
                  </p>
                </div>
              </div>
            </div>

            {/* Blockquote Quote */}
            <p className="font-sans text-[13px] md:text-sm text-griya-muted mb-10 italic border-l-2 border-griya-outline pl-6 leading-relaxed max-w-md">
              &ldquo;Konsultasikan kebutuhan alat rumah tangga, perkakas tukang, dan alat motor Anda
              sekarang, kami siap membantu memilihkan yang paling tepat.&rdquo;
            </p>

            {/* Google Maps CTA */}
            <div className="flex flex-wrap gap-4">
              <a
                href={CONTACT_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#2C2724] text-white px-8 md:px-12 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-griya-secondary transition-colors duration-300 flex items-center gap-2"
              >
                <Map size={14} /> BUKA PETA
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
