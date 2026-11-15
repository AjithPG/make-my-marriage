import { FamilyRoles } from "@/components/home/family-roles/family-roles";
import { Faq } from "@/components/home/faq/faq";
import { Features } from "@/components/home/features/features";
import { FinalCta } from "@/components/home/final-cta/final-cta";
import { GuestExperience } from "@/components/home/guest-experience/guest-experience";
import { Hero } from "@/components/home/hero/hero";
import { HowItWorks } from "@/components/home/how-it-works/how-it-works";
import { SiteFooter } from "@/components/home/site-footer/site-footer";
import { SiteHeader } from "@/components/home/site-header/site-header";
import { TrustStrip } from "@/components/home/trust-strip/trust-strip";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <Features />
        <GuestExperience />
        <FamilyRoles />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
