import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import HowItWorks from '../components/sections/HowItWorks'
import Features from '../components/sections/Features'
import Pricing from '../components/sections/Pricing'
import CTA from '../components/sections/CTA'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
