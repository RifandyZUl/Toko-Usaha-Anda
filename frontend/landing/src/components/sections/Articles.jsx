import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import Section from '../common/Section'

/**
 * Articles Section - Tips & Informasi
 */
function Articles() {
  const [ref, hasIntersected] = useIntersectionObserver()

  const articles = [
    {
      title: 'Tips Memilih Perkakas Tukang yang Tepat untuk Proyek Anda',
      date: '15 Januari 2024',
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=600&fit=crop&q=80',
    },
    {
      title: 'Cara Merawat Alat Rumah Tangga agar Awet dan Tahan Lama',
      date: '10 Januari 2024',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&q=80',
    },
    {
      title: 'Panduan Lengkap Perawatan Motor dengan Alat yang Tepat',
      date: '5 Januari 2024',
      image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=600&fit=crop&q=80',
    },
  ]

  return (
    <Section id="articles" alternate ref={ref} className="bg-beige-50">
      {/* Section Header */}
      <div className="text-center mb-12 sm:mb-16">
        <p className="text-sm sm:text-base text-brown-600 uppercase tracking-wider mb-2 font-body">
          TIPS & INFORMASI
        </p>
        <h2 className="text-[36px] sm:text-[42px] md:text-[48px] lg:text-[56px] font-heading font-bold text-brown-900">
          Tips & Informasi
        </h2>
      </div>

      {/* Grid Articles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
        {articles.map((article, index) => (
          <div
            key={index}
            className={`group transition-all duration-700 ${
              hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
              {/* Article Image */}
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-beige-100 to-brown-100">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              
              {/* Article Info */}
              <div className="p-6">
                <h3 className="text-base sm:text-lg font-heading font-bold text-brown-900 mb-3 line-clamp-2 group-hover:text-brown-700 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-brown-600 font-body">
                  {article.date}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

export default Articles
