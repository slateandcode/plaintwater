import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Services from '@/components/sections/Services'
import Work from '@/components/sections/Work'
import Method from '@/components/sections/Method'
import Questions from '@/components/sections/Questions'
import Contact from '@/components/sections/Contact'
import Footer from '@/components/sections/Footer'

export default function Home() {
  return (
    <>
      <main id="main">
        <Hero />
        <About />
        <Services />
        <Work />
        <Method />
        <Questions />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
