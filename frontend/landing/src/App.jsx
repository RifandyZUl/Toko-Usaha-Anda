import { useEffect } from 'react'
import Navigation from './components/layout/Navigation'
import Hero from './components/sections/Hero'
import Products from './components/sections/Products'
import FeaturedProducts from './components/sections/FeaturedProducts'
import About from './components/sections/About'
import CTA from './components/sections/CTA'
import Contact from './components/sections/Contact'
import Footer from './components/layout/Footer'
import { ScrollToTop } from './components/common/ScrollToTop'
import { useScrollToTop } from './hooks/useScrollToTop'

function App() {
  const { scrollToTop } = useScrollToTop()

  useEffect(() => {
    // Scroll to top on mount
    scrollToTop()
  }, [scrollToTop])

  return (
    <div className="min-h-screen bg-white antialiased">
      <Navigation />
      <main className="relative">
        <Hero />
        <Products />
        <FeaturedProducts />
        <About />
        <CTA />
        <Contact />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  )
}

export default App
