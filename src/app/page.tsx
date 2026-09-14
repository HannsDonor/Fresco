import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServicesSection from "@/components/ServicesSection";
import HowItWorks from "@/components/HowItWorks";
import ShopInformation from "@/components/ShopInformation";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Hero />
        <ServicesSection />
        <HowItWorks />
        <ShopInformation />
        <CallToAction />
        <Footer />
      </main>
    </div>
  );
}