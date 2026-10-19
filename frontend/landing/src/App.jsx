import { useEffect } from 'react'
import ErrorBoundary from '@shared/components/ErrorBoundary.jsx'
import Navigation from './components/layout/Navigation'
import Hero from './components/sections/Hero'
import Features from './components/sections/Features'
import Products from './components/sections/Products'
import About from './components/sections/About'
import FeaturedProducts from './components/sections/FeaturedProducts'
import Testimonials from './components/sections/Testimonials'
import FAQ from './components/sections/FAQ'
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
    <ErrorBoundary>
      <div className="min-h-screen bg-griya-bg antialiased">
        <Navigation />
        <main className="relative">
          <Hero />
          <Features />
          <Products />
          <About />
          <FeaturedProducts />
          <Testimonials />
          <FAQ />
          <Contact />
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    </ErrorBoundary>
  )
}

export default App
