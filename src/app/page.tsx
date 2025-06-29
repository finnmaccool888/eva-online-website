"use client";

import { useEffect, useState } from "react";
import Loading from "./loading";
import { AnimatePresence } from "framer-motion";
import Hero from "@/components/hero";
import AboutShort from "@/components/about-short";
import Abilities from "@/components/abilities";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  return (
    <>
      <Hero />
      <Abilities />
      <AboutShort />
      <AnimatePresence>{isLoading && <Loading />}</AnimatePresence>
    </>
  );
}
