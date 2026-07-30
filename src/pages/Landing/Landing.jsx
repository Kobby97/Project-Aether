import Navbar from '../../components/Navbar/Navbar';
import Hero from '../../components/Landing/Hero';
import Features from '../../components/Landing/Features';
import Benefits from '../../components/Landing/Benefits';
import Stats from '../../components/Landing/Stats';
import Testimonials from '../../components/Landing/Testimonials';
import CTA from '../../components/Landing/CTA';
import Footer from '../../components/Footer/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar tone="light" />
      <Hero />
      <Features />
      <Benefits />
      <Stats />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
