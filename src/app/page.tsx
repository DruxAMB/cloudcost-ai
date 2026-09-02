import Header from "./components/Header";
import Hero from "./components/Hero";
import LogoMarquee from "./components/LogoMarquee";
import NumberedCards from "./components/NumberedCards";
import ShipWithAI from "./components/ShipWithAI";
import ControlSection from "./components/ControlSection";
import HowItWorks from "./components/HowItWorks";
import BuiltForDevelopers from "./components/BuiltForDevelopers";
import CustomerStories from "./components/CustomerStories";
import Resources from "./components/Resources";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import HorizontalScroll from "./components/HorizontalScroll";
import HomeClient from "./components/HomeClient";
import PanelNav from "./components/PanelNav";

/**
 * In Next 16 `searchParams` is a Promise — we await it server-side so the
 * `?app=1` variant renders with the app visible in the initial HTML (no
 * client-side flash). `useSearchParams` would force the whole tree into a
 * client boundary; reading it here keeps the landing server-rendered.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const params = await searchParams;
  const initialAppOpen = params.app === "1";

  return (
    <HomeClient initialAppOpen={initialAppOpen}>
      <Header />
      <main id="top" className="flex-1 bg-ld-dark">
        {/* Hero is sticky within this wrapper — LogoMarquee and
            NumberedCards scroll over it. Hero releases when
            NumberedCards' pin begins. */}
        <div className="hero-wrapper relative">
          <Hero />
          <LogoMarquee />
          <div id="how-it-works">
            <NumberedCards />
          </div>
        </div>
        {/* Proof comes before the integration panels — a judge sees what
            the system actually produced before reading how it was built. */}
        <CustomerStories />
        {/* Horizontal scroll track: 5 sections become side-by-side panels.
            Vertical scroll drives horizontal movement.
            #demo and #architecture live on panels inside this track —
            PanelNav intercepts those anchors and scrolls to the exact panel
            via Lenis, so they land on the right content instead of the
            track's start. */}
        <HorizontalScroll>
          <ShipWithAI />
          <ControlSection variant="primary" />
          <ControlSection variant="sponsor" reverse />
          <HowItWorks />
          <BuiltForDevelopers />
        </HorizontalScroll>
        <div id="resources">
          <Resources />
        </div>
      </main>
      <CTA />
      <Footer />
      <PanelNav />
    </HomeClient>
  );
}
