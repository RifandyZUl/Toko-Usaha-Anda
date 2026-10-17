import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'

function About() {
  const [ref, hasIntersected] = useIntersectionObserver()

  return (
    <section
      id="about"
      ref={ref}
      className="py-24 md:py-32 bg-white"
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text Column */}
          <div
            className={`transition-all duration-1000 transform ${
              hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <span className="text-griya-secondary font-sans text-xs tracking-[0.2em] uppercase block mb-4">
              Tentang Toko Usaha Anda
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-griya-primary mb-6 leading-tight max-w-lg">
              Solusi Terpercaya untuk Kebutuhan Anda
            </h2>
            <p className="font-sans text-sm md:text-base text-griya-muted mb-6 leading-relaxed max-w-lg">
              Toko Usaha Anda adalah mitra terpercaya yang menyediakan berbagai kebutuhan alat rumah tangga, perkakas tukang, dan alat motor dengan kualitas terbaik dan harga terjangkau.
            </p>
            <p className="font-sans text-sm md:text-base text-griya-muted mb-12 leading-relaxed max-w-lg">
              Dengan pengalaman lebih dari 15 tahun melayani ribuan pelanggan, kami berkomitmen untuk selalu memberikan produk unggulan, fungsional, dan tahan lama.
            </p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-griya-outline/40 max-w-lg">
              <div>
                <div className="text-griya-primary font-serif text-3xl md:text-4xl mb-2">
                  15+
                </div>
                <div className="font-sans text-[10px] md:text-xs text-griya-muted uppercase tracking-[0.1em]">
                  Tahun Pengalaman
                </div>
              </div>
              <div>
                <div className="text-griya-primary font-serif text-3xl md:text-4xl mb-2">
                  5K+
                </div>
                <div className="font-sans text-[10px] md:text-xs text-griya-muted uppercase tracking-[0.1em]">
                  Klien Puas
                </div>
              </div>
              <div>
                <div className="text-griya-primary font-serif text-3xl md:text-4xl mb-2">
                  100%
                </div>
                <div className="font-sans text-[10px] md:text-xs text-griya-muted uppercase tracking-[0.1em]">
                  Produk Berkualitas
                </div>
              </div>
            </div>
          </div>

          {/* Image Column */}
          <div
            className={`relative transition-all duration-1000 delay-300 transform ${
              hasIntersected ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            <div className="aspect-[4/5] overflow-hidden bg-griya-surface-low">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4Kxsz8k06ztZlUXU8zlPpYuoq3KK6S4fIyMBHoKCzQqaX_GwPVnBTtamTQa5uyx9f1uA3Awfbrrb4hhWyDtFPYQCpwf3qKnetCuoNQYevShQJBqB6-daiTSQ-btK_T-tAdGkDY-H-C3P8t9Crdc2QYW2KqhTeWNMz2uWFKLbdz-XG-ZVNgqrp3MTUNm99J4mUo0ZLtuj44WfT7RsG_3nHo1hk7Jjc10bE6J2NnXvH76PGqu8IvoW2XJ4wMskcgpGZwfXvwjVQ9Fw"
                alt="Pengrajin Kayu di Toko Usaha Anda"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-[10000ms] ease-out"
                loading="lazy"
              />
            </div>
            
            {/* Overlay Quote Card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 md:p-8 border border-griya-outline/20 shadow-[0_10px_40px_rgba(0,0,0,0.05)] hidden sm:block max-w-[280px]">
              <p className="font-serif text-lg md:text-xl text-griya-primary leading-relaxed">
                &ldquo;Kualitas terbaik untuk mendukung hunian & usaha Anda.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
