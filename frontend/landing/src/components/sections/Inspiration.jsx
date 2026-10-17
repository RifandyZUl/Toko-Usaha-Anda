import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'

function Inspiration() {
  const [ref, hasIntersected] = useIntersectionObserver()

  return (
    <section
      id="inspirasi"
      ref={ref}
      className="py-24 md:py-32 bg-white"
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl text-griya-primary mb-4">
            Inspirasi Penggunaan
          </h2>
          <p className="font-sans text-sm md:text-base text-griya-muted">
            Lihat bagaimana produk kami menunjang aktivitas rumah tangga dan pekerjaan harian Anda.
          </p>
        </div>

        {/* Collage Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 h-auto md:h-[700px]">
          {/* Large Left Column */}
          <div
            className={`md:col-span-7 group relative overflow-hidden transition-all duration-1000 transform ${
              hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <img
              src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800"
              alt="Dapur Bersih Rumah Tangga"
              className="w-full h-full object-cover transition-transform duration-[15000ms] ease-out group-hover:scale-105"
              loading="lazy"
            />
            {/* Overlay Text */}
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-serif text-xl md:text-2xl text-white mb-2">
                Dapur Fungsional
              </h3>
              <p className="font-sans text-xs md:text-sm text-white/90">
                Peralatan masak terbaik untuk hidangan keluarga.
              </p>
            </div>
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 pointer-events-none" />
          </div>

          {/* Right Columns (2 stacked items) */}
          <div className="md:col-span-5 flex flex-col gap-4 md:gap-6">
            {/* Top Right Card */}
            <div
              className={`flex-1 group relative overflow-hidden transition-all duration-1000 delay-200 transform ${
                hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=800"
                alt="Bengkel Kerja Perkakas"
                className="w-full h-full object-cover transition-transform duration-[15000ms] ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <h4 className="font-sans font-semibold text-[11px] text-white tracking-[0.15em] uppercase">
                  Bengkel Kerja Produktif
                </h4>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-80 pointer-events-none" />
            </div>

            {/* Bottom Right Card */}
            <div
              className={`flex-1 group relative overflow-hidden transition-all duration-1000 delay-400 transform ${
                hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=800"
                alt="Garasi Motor Otomotif"
                className="w-full h-full object-cover transition-transform duration-[15000ms] ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <h4 className="font-sans font-semibold text-[11px] text-white tracking-[0.15em] uppercase">
                  Perawatan Motor Berkala
                </h4>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-80 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Inspiration
