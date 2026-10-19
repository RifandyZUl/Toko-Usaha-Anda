import { useState } from 'react'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react'
import { CONTACT_WHATSAPP } from '../../utils/constants'

const FAQ_DATA = [
  {
    id: 1,
    question: 'Apakah produk yang dijual di Toko Usaha Anda bergaransi dan original?',
    answer:
      'Semua produk yang kami jual dijamin 100% original, baru, dan telah melalui seleksi kualitas ketat. Kami memberikan garansi penukaran barang atau pengembalian dana jika pesanan yang Anda terima mengalami cacat pabrik atau rusak saat dalam perjalanan pengiriman.',
  },
  {
    id: 2,
    question: 'Metode pembayaran apa saja yang diterima untuk belanja online?',
    answer:
      'Kami mendukung pembayaran digital instan melalui QRIS (bisa scan dari GoPay, OVO, Dana, ShopeePay, LinkAja, dan mobile banking mana pun), transfer Virtual Account bank ternama (BCA, Mandiri, BRI, BNI), kartu kredit/debit via Midtrans, serta pembayaran tunai saat berkunjung langsung ke toko fisik kami.',
  },
  {
    id: 3,
    question: 'Bagaimana opsi pengiriman dan estimasi waktu sampai?',
    answer:
      'Untuk pengiriman reguler ke seluruh kota di Indonesia, kami bekerjasama dengan ekspedisi resmi terpercaya seperti JNE, J&T Express, dan SiCepat dengan nomor resi otomatis yang bisa dilacak. Khusus wilayah Tangerang dan sekitarnya, tersedia opsi kurir instan/sameday seperti GoSend dan GrabExpress agar barang tiba di hari yang sama.',
  },
  {
    id: 4,
    question: 'Apakah saya bisa datang langsung berbelanja ke toko fisik?',
    answer:
      'Tentu saja sangat bisa! Showroom fisik Toko Usaha Anda berlokasi di Jl. KH. Mas Mansyur, Tangerang, Indonesia. Kami buka setiap hari (Senin hingga Minggu) mulai pukul 07.00 sampai 22.00 WIB. Anda bisa melihat fisik barang dan berkonsultasi langsung dengan staf kami.',
  },
  {
    id: 5,
    question: 'Bagaimana jika saya bingung memilih produk atau butuh spesifikasi khusus?',
    answer:
      'Tim kami siap membantu Anda dengan ramah! Cukup klik tombol "Tanya via WhatsApp", ceritakan kebutuhan proyek tukang, kebutuhan rumah tangga, atau sparepart motor yang Anda cari, dan admin kami akan memberikan saran produk yang paling tepat dan hemat biaya.',
  },
]

function FAQ() {
  const [ref, hasIntersected] = useIntersectionObserver()
  const [openId, setOpenId] = useState(1) // Default first item open

  const toggleFAQ = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <section id="faq" ref={ref} className="py-24 md:py-32 bg-griya-surface-low border-t border-griya-outline/20">
      <div className="max-w-[1000px] mx-auto px-5 md:px-10 lg:px-16">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transition-all duration-1000 transform ${
            hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 text-griya-secondary font-sans text-xs tracking-[0.2em] uppercase font-semibold mb-3">
            <HelpCircle size={15} />
            <span>Tanya Jawab Umum</span>
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-griya-primary mb-4">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="font-sans text-sm md:text-base text-griya-muted max-w-xl mx-auto leading-relaxed">
            Temukan jawaban ringkas seputar keaslian produk, metode pembayaran digital, opsi pengiriman, dan layanan toko kami.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQ_DATA.map((faq, index) => {
            const isOpen = openId === faq.id
            return (
              <div
                key={faq.id}
                className={`bg-white border transition-all duration-500 transform ${
                  isOpen
                    ? 'border-griya-secondary shadow-[0_8px_24px_rgba(0,0,0,0.04)]'
                    : 'border-griya-outline/30 hover:border-griya-outline/60'
                } ${hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-6 md:p-7 flex items-center justify-between gap-4 focus:outline-none cursor-pointer select-none"
                >
                  <span className="font-serif text-base md:text-lg text-griya-primary font-medium leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isOpen
                        ? 'bg-griya-secondary text-white rotate-180'
                        : 'bg-griya-surface-low text-griya-muted'
                    }`}
                  >
                    <ChevronDown size={18} strokeWidth={2} />
                  </div>
                </button>

                {/* Answer Content */}
                <div
                  className={`grid transition-all duration-300 ease-in-out px-6 md:px-7 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100 pb-6 md:pb-7' : 'grid-rows-[0fr] opacity-0 pb-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="font-sans text-[13px] md:text-sm text-griya-muted leading-relaxed border-t border-griya-outline/20 pt-4 text-justify">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Help Card */}
        <div
          className={`mt-12 p-6 md:p-8 bg-white border border-griya-outline/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left transition-all duration-1000 delay-300 transform ${
            hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div>
            <h4 className="font-serif text-lg text-griya-primary font-medium mb-1">
              Masih punya pertanyaan lain yang belum terjawab?
            </h4>
            <p className="font-sans text-xs md:text-sm text-griya-muted">
              Admin kami selalu siap membantu Anda setiap hari pukul 07.00 - 22.00 WIB.
            </p>
          </div>
          <a
            href={`https://wa.me/${CONTACT_WHATSAPP}?text=Halo%20Toko%20Usaha%20Anda%2C%20saya%20ingin%20bertanya%20seputar%20produk%20dan%20layanan.`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 bg-[#2C2724] hover:bg-griya-secondary text-white px-6 py-3.5 text-xs font-sans font-semibold tracking-wider uppercase transition-colors duration-300"
          >
            <MessageCircle size={15} />
            <span>Tanya via WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  )
}

export default FAQ
