"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function SeasonTwoBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative mb-6 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#FF007A]/10 via-[#FF007A]/5 to-transparent backdrop-blur-sm"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF007A]/5 to-transparent opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,0,122,0.1),transparent_50%)]" />
      
      {/* Eva Image */}
      <div className="absolute -right-8 -bottom-4 opacity-20">
        <Image
          src="/images/eva assets/eva image bank/evaPoint.png"
          alt="Eva"
          width={200}
          height={200}
          className="object-contain"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
          {/* Left side - Text */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#FF007A] rounded-full animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF007A]">
                  New Mindshare Campaign
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-[#FF007A]/30 to-transparent" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-[#48333D]">
                Season Two
              </h2>
              <h3 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-[#FF007A] to-[#FF6B9D] bg-clip-text text-transparent">
                Eva Yaps!
              </h3>
              <p className="text-sm lg:text-base text-[#48333D]/80 leading-relaxed">
                Featuring <span className="font-semibold text-[#FF007A]">inSpace Yapping</span>
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FF007A]/10 border border-[#FF007A]/20 rounded-full">
                <div className="w-2 h-2 bg-[#FF007A] rounded-full animate-pulse" />
                <span className="text-xs font-medium text-[#FF007A]">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Visual elements */}
          <div className="flex items-center gap-4">
            {/* Floating Eva images */}
            <div className="relative">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-20"
              >
                <Image
                  src="/images/eva assets/eva image bank/evaarmscrossed.png"
                  alt="Eva Arms Crossed"
                  width={80}
                  height={80}
                  className="object-contain opacity-90"
                />
              </motion.div>
            </div>

            <div className="relative">
              <motion.div
                animate={{ 
                  y: [0, 10, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="relative z-20"
              >
                <Image
                  src="/images/eva assets/eva image bank/evameditate.png"
                  alt="Eva Meditate"
                  width={70}
                  height={70}
                  className="object-contain opacity-80"
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF007A] via-[#FF6B9D] to-transparent" />
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF007A]/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
} 