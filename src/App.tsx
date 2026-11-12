import { Header } from './components/Header'
import { Story } from './components/Story'
import { Services } from './components/Services'
import { Studies } from './components/Studies'
import { Process } from './components/Process'
import { Enquiry } from './components/Enquiry'
import { Footer } from './components/Footer'

export default function App() {
  return (
    <>
      <Header />
      <main id="main">
        <Story />
        <Services />
        <Studies />
        <Process />
        <Enquiry />
      </main>
      <Footer />
    </>
  )
}
