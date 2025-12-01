import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import Section from '../common/Section'
import Button from '../common/Button'
import { scrollToElement } from '../../utils/scroll'

/**
 * CTA Section - Nike style: Simple call to action dengan background hitam
 */
function CTA() {
  const [ref, hasIntersected] = useIntersectionObserver()

  const handleButtonClick = () => {
    scrollToElement('contact')
  }

  return (
    <Section id="cta" ref={ref} className="bg-black py-12 sm:py-16 md:py-24 lg:py-32 xl:py-40">
      <div className="container-custom max-w-4xl mx-auto text-center">
        <div
          className={`space-y-6 sm:space-y-8 transition-all duration-700 ${
            hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-[36px] sm:text-[48px] md:text-[56px] lg:text-[64px] xl:text-[72px] font-heading font-black text-white mb-4 sm:mb-6 tracking-tighter">
            Siap Memulai?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 font-body font-light leading-relaxed max-w-2xl mx-auto">
            Temukan semua kebutuhan Anda di satu tempat dengan kualitas terbaik
          </p>
          <div className="pt-8">
            <Button
              onClick={handleButtonClick}
              variant="outline"
              size="lg"
              className="bg-white text-black hover:bg-gray-100 font-semibold px-12 py-5 text-lg sm:text-xl transition-all duration-300 rounded-full border-0"
            >
              Hubungi Kami
            </Button>
          </div>
        </div>
      </div>
    </Section>
  )
}

export default CTA
