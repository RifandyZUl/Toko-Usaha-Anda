import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { Hammer, Home, Settings } from 'lucide-react'
import { SHOP_URL } from '../../utils/constants'

function Products() {
  const [ref, hasIntersected] = useIntersectionObserver()

  const categories = [
    {
      id: 1,
      title: 'Perkakas Tukang',
      description: 'Peralatan pertukangan, mesin & alat konstruksi berkualitas',
      icon: Hammer,
      slug: 'tools',
    },
    {
      id: 2,
      title: 'Kebutuhan Rumah Tangga',
      description: 'Perlengkapan dapur, kebersihan & perabot rumah lengkap',
      icon: Home,
      slug: 'household',
    },
    {
      id: 3,
      title: 'Alat Alat Motor',
      description: 'Suku cadang, perkakas servis & aksesoris kendaraan roda dua',
      icon: Settings,
      slug: 'motorcycle',
    },
  ]

  return (
    <section
      id="kategori"
      ref={ref}
      className="py-24 bg-griya-surface-low"
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl text-griya-primary">
            Jelajahi Berdasarkan Kategori
          </h2>
        </div>

        {/* Categories Grid - 3 Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {categories.map((category, index) => {
            const IconComponent = category.icon
            return (
              <a
                href={`${SHOP_URL}/shop?category=${category.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                key={category.id}
                className={`group bg-white flex flex-col items-center text-center p-8 md:p-10 transition-all duration-700 transform hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 border border-griya-outline/20 hover:border-griya-secondary/40 ${
                  hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <div className="w-16 h-16 rounded-full bg-griya-surface-low flex items-center justify-center mb-6 group-hover:bg-griya-secondary group-hover:text-white text-griya-muted transition-colors duration-300">
                  <IconComponent size={26} strokeWidth={1.5} />
                </div>
                <h3 className="font-sans text-sm md:text-base text-griya-primary font-semibold tracking-wider uppercase mb-2">
                  {category.title}
                </h3>
                <p className="font-sans text-xs text-griya-muted leading-relaxed">
                  {category.description}
                </p>
                <span className="mt-6 text-[11px] font-sans font-semibold tracking-[0.15em] uppercase text-griya-secondary group-hover:underline">
                  Lihat Produk &rarr;
                </span>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Products
