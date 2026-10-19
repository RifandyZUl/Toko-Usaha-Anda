import { SHOP_URL } from '../../utils/constants'

const COURIER_LOGOS = [
  { name: 'JNE Express', src: '/assets/logos/jne.webp' },
  { name: 'J&T Express', src: '/assets/logos/jnt.webp' },
  { name: 'SiCepat Ekspres', src: '/assets/logos/sicepat.webp' },
  { name: 'GoSend', src: '/assets/logos/gosend.webp' },
  { name: 'GrabExpress', src: '/assets/logos/grab.webp' },
]

const PAYMENT_LOGOS = [
  { name: 'QRIS', src: '/assets/logos/qris.svg' },
  { name: 'BCA', src: '/assets/logos/bca.svg' },
  { name: 'Mandiri', src: '/assets/logos/mandiri.svg' },
  { name: 'BRI', src: '/assets/logos/bri.svg' },
  { name: 'BNI', src: '/assets/logos/bni.svg' },
  { name: 'GoPay', src: '/assets/logos/gopay.svg' },
  { name: 'ShopeePay', src: '/assets/logos/shopeepay.svg' },
  { name: 'Visa', src: '/assets/logos/visa.svg' },
  { name: 'Mastercard', src: '/assets/logos/mastercard.svg' },
]

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
                href={`${SHOP_URL}/shop?category=tools`}
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
                href={`${SHOP_URL}/shop?category=household`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-griya-primary transition-colors duration-300 relative group"
              >
                <span className="relative z-10">Kebutuhan Rumah Tangga</span>
                <span className="absolute bottom-0 left-0 w-0 h-px bg-griya-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
            <li>
              <a
                href={`${SHOP_URL}/shop?category=motorcycle`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-griya-primary transition-colors duration-300 relative group"
              >
                <span className="relative z-10">Aksesoris Motor</span>
                <span className="absolute bottom-0 left-0 w-0 h-px bg-griya-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Trust Badges - Shipping & Payment Methods */}
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16 mt-14 pt-10 border-t border-griya-outline/20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Shipping Couriers */}
          <div className="lg:col-span-5">
            <h5 className="font-sans text-[11px] font-semibold tracking-[0.18em] text-griya-primary uppercase mb-3">
              Jasa Pengiriman Resmi
            </h5>
            <div className="flex flex-wrap items-center gap-2.5">
              {COURIER_LOGOS.map((courier) => (
                <div
                  key={courier.name}
                  title={courier.name}
                  className="h-10 px-3 bg-white border border-griya-outline/30 rounded flex items-center justify-center hover:border-griya-secondary hover:shadow-xs transition-all duration-200"
                >
                  <img
                    src={courier.src}
                    alt={courier.name}
                    loading="lazy"
                    className="h-5 md:h-6 w-auto max-w-[85px] object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payment Gateways */}
          <div className="lg:col-span-7">
            <h5 className="font-sans text-[11px] font-semibold tracking-[0.18em] text-griya-primary uppercase mb-3">
              Metode Pembayaran Aman
            </h5>
            <div className="flex flex-wrap items-center gap-2.5">
              {PAYMENT_LOGOS.map((method) => (
                <div
                  key={method.name}
                  title={method.name}
                  className="h-10 px-2.5 bg-white border border-griya-outline/30 rounded flex items-center justify-center hover:border-griya-secondary hover:shadow-xs transition-all duration-200"
                >
                  <img
                    src={method.src}
                    alt={method.name}
                    loading="lazy"
                    className="h-5 md:h-6 w-auto max-w-[80px] object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16 mt-12 pt-8 border-t border-griya-outline/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <p className="font-sans font-semibold text-[10px] text-griya-muted uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} Toko Usaha Anda. All rights reserved.
        </p>
        <p className="font-sans text-[11px] text-griya-muted/70 tracking-wider">
          Kualitas Terjamin &bull; Pelayanan Terpercaya
        </p>
      </div>
    </footer>
  )
}

export default Footer
