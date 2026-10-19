import { SHOP_URL } from '../../utils/constants'

function Footer() {
  return (
    <footer className="bg-white py-16 md:py-24 border-t border-griya-outline/20 text-griya-primary">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
        {/* Column 1 - Brand & About */}
        <div className="col-span-1 md:col-span-6">
          <span className="font-serif text-xl md:text-2xl uppercase tracking-[0.2em] mb-6 block text-griya-primary">
            Toko Usaha Anda
          </span>
          <p className="font-sans text-[13px] md:text-sm text-griya-muted mb-8 leading-relaxed max-w-md text-justify">
            Menciptakan kemudahan untuk hunian dan usaha Anda sejak tahun 2000. Dedikasi kami adalah
            pada kualitas barang perkakas, rumah tangga, otomotif, dan kepuasan pelanggan.
          </p>
        </div>

        {/* Column 2 - Info */}
        <div className="col-span-1 md:col-span-3">
          <h4 className="font-serif text-lg text-griya-primary mb-6">Informasi</h4>
          <ul className="space-y-4 font-sans text-[13px] md:text-sm text-griya-muted">
            <li>
              <a
                href="#about"
                className="hover:text-griya-primary transition-colors duration-300 relative group"
              >
                <span className="relative z-10">Tentang Kami</span>
                <span className="absolute bottom-0 left-0 w-0 h-px bg-griya-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="hover:text-griya-primary transition-colors duration-300 relative group"
              >
                <span className="relative z-10">Kontak Kami</span>
                <span className="absolute bottom-0 left-0 w-0 h-px bg-griya-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="hover:text-griya-primary transition-colors duration-300 relative group"
              >
                <span className="relative z-10">Lokasi Showroom</span>
                <span className="absolute bottom-0 left-0 w-0 h-px bg-griya-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="hover:text-griya-primary transition-colors duration-300 relative group"
              >
                <span className="relative z-10">Syarat & Ketentuan</span>
                <span className="absolute bottom-0 left-0 w-0 h-px bg-griya-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3 - Collections */}
        <div className="col-span-1 md:col-span-3">
          <h4 className="font-serif text-lg text-griya-primary mb-6">Kategori</h4>
          <ul className="space-y-4 font-sans text-[13px] md:text-sm text-griya-muted">
            <li>
              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-griya-primary transition-colors duration-300 relative group"
              >
                <span className="relative z-10">Alat Rumah Tangga</span>
                <span className="absolute bottom-0 left-0 w-0 h-px bg-griya-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
            <li>
              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-griya-primary transition-colors duration-300 relative group"
              >
                <span className="relative z-10">Perkakas Tukang</span>
                <span className="absolute bottom-0 left-0 w-0 h-px bg-griya-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
            <li>
              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-griya-primary transition-colors duration-300 relative group"
              >
                <span className="relative z-10">Alat Motor</span>
                <span className="absolute bottom-0 left-0 w-0 h-px bg-griya-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16 mt-16 pt-8 border-t border-griya-outline/10 text-center">
        <p className="font-sans font-semibold text-[10px] text-griya-muted uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} Toko Usaha Anda. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
