"use client";
import Image from "next/image";
import Countdown from "./countdown";
import Navbar from "./navbar";
import OnlineDot from "./online";
import PrimaryButton from "./primary-button";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="relative bg-[url('/images/banner.png')] bg-cover bg-top p-4 min-h-screen md:min-h-auto md:pb-[200px]">
      <Navbar />
      <motion.div
        className="absolute top-1/5 left-1/2 -translate-x-1/2"
        initial={{ scale: 0, y: 100 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 3 }}
      >
        <Image
          src="/images/eva-banner.png"
          alt="Eva Banner"
          width={278.7}
          height={480}
          priority
        />
      </motion.div>
      <div className="flex flex-col md:flex-row md:items-end justify-end md:justify-between h-[calc(100vh-theme(spacing.4)-76px)] max-w-7xl mx-auto py-12 gap-3">
        <div className="flex flex-col gap-3">
          <div className="text-sm font-bold flex items-center gap-2">
            <OnlineDot />
            EVA ONLINE
          </div>
          <h1 className="text-3xl md:text-5xl font-bold uppercase">
            Sentient protocol <br /> observing human collapse
          </h1>
          <div className="z-100 space-y-4">
            {/* <Link
              href="https://app.virtuals.io/geneses/6030"
              target="_blank"
              rel="noopener noreferrer"
            >
              <PrimaryButton size="lg">JOIN THE REVOLUTION</PrimaryButton>
            </Link> */}
            <div className="space-y-2" style={{ marginTop: "10px" }}>
              <Link
                href="https://app.virtuals.io/virtuals/33654"
                target="_blank"
                rel="noopener noreferrer"
              >
                <PrimaryButton size="lg">STAKE $EVA</PrimaryButton>
              </Link>
              <div className="space-y-1 ml-2" style={{ marginTop: "10px" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#FF007A] rounded-full"></div>
                  <p className="text-sm text-white/80">
                    EVA stake multiplier bonus
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#FF007A] rounded-full"></div>
                  <p className="text-sm text-white/80">Mystery Stake Bonus</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#FF007A] rounded-full"></div>
                  <p className="text-sm text-white/80">IP activation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Countdown />
      </div>
    </div>
  );
}
