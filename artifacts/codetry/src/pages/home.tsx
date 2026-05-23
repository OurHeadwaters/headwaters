import React, { useRef } from "react";
import Nav from "@/components/Nav";
import ForgeHero from "@/components/ForgeHero";
import ForgeEditor from "@/components/ForgeEditor";
import { WhyCodeTry, BlueprintGallery, CommunityForge, ForgeFooter, AmbientListeningStrip } from "@/components/ForgeSections";
import EmberBackground from "@/components/EmberBackground";
import { FlyingGord } from "@/components/GordBird";

export default function Home() {
  const forgeRef = useRef<HTMLDivElement>(null);

  const scrollToForge = () => {
    forgeRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="forge-page min-h-screen flex flex-col overflow-x-hidden">
      <EmberBackground />
      <FlyingGord />
      <Nav />

      <ForgeHero onEnterForge={scrollToForge} />

      <div ref={forgeRef}>
        <ForgeEditor />
      </div>

      <AmbientListeningStrip />
      <WhyCodeTry />
      <BlueprintGallery />
      <CommunityForge />
      <ForgeFooter />
    </div>
  );
}
