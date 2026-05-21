import Sidebar from "@/components/Sidebar";
import Hero from "@/components/Hero";
import StatsPanel from "@/components/StatsPanel";
import Story from "@/components/Story";
import Awards from "@/components/Awards";
import People from "@/components/People";
import Day from "@/components/Day";
import Place from "@/components/Place";
import Partners from "@/components/Partners";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <>
      <Sidebar />
      <main className="stage">
        <Hero />
        <StatsPanel />
        <Story />
        <Awards />
        <People />
        <Day />
        <Place />
        <Partners />
        <Footer />
      </main>
    </>
  );
}
