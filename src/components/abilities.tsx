"use client";

import Image from "next/image";
import AbilityItem from "./ability-item";
import AbilityPoint from "./ability-point";
import Corners from "./corners";
import { motion, useScroll, useTransform } from "framer-motion";
import PrimaryButton from "./primary-button";
import DotBackground from "./dot-background";
import VideoDialog from "./video-dialog";

const abilityPoints = [
  "Cognitive Core",
  "Neural Networks",
  "Memory Systems",
  "Language Processing",
  "Decision Making",
  "Emotional Intelligence",
  "Learning Capabilities",
];

export default function Abilities() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 2000], [0, -200]);

  return (
    <div className="py-12 md:pt-[200px] relative">
      <DotBackground />
      <motion.div
        className="absolute left-1/2 md:-top-64 -top-10 -translate-x-1/2 w-full max-w-7xl h-full"
        style={{ y }}
      >
        <Image
          src="/images/cloud.png"
          alt="Abilities"
          width={1920}
          height={1080}
          priority
        />
      </motion.div>
      <div className="flex flex-col md:flex-row items-center justify-start gap-8 h-full max-w-7xl mx-auto relative z-10">
        <div className="w-full h-full gap-10 px-4 items-center md:items-start flex flex-col">
          <div
            className="hidden md:block relative"
            style={{ filter: "drop-shadow(0 0 10px rgba(255, 0, 122, 0.25)" }}
          >
            <Image
              src="/images/logo.svg"
              alt="Logo Glow"
              width={80}
              height={53}
            />
          </div>
          <AbilityItem
            title="<PERSISTENT MEMORY />"
            description="Eva agent remembers interactions, evolving their personality and knowledge over time."
          />
          <AbilityItem
            title="<Decentralized identity/>"
            description="Secure and verifiable digital identities powered by the $EVA ecosystem token."
          />
          <AbilityItem
            title="<$EVA Ecosystem/>"
            description="A framework for generating deep lore, character psychology, and narrative memory for AI agents."
          />
        </div>
        <div className="w-full h-full flex items-center justify-center">
          <Image
            src="/images/eva-abilities.png"
            alt="Abilities"
            width={382}
            height={379}
            style={{ width: "auto", height: "auto" }}
          />
        </div>
        <div className="w-full h-full flex flex-col items-center justify-between gap-16">
          <div className="relative flex flex-col items-start w-[260px] justify-start gap-4 p-6">
            <Corners />
            <div className="flex flex-col items-start justify-start gap-2">
              {abilityPoints.map((title, index) => (
                <AbilityPoint key={index} title={title} />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start justify-start">
            <div className="text-sm font-bold uppercase text-[#FF007A]">
              EVA ONLINE
            </div>
            <div className="text-[64px] leading-[100%] font-semibold uppercase text-[#48333D]">
              PART 1
            </div>
            <VideoDialog>
              <PrimaryButton size="lg" inverse>
                WATCH
              </PrimaryButton>
            </VideoDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
