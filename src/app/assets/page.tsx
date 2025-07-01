"use client";

import Image from "next/image";
import Navbar from "@/components/navbar";

const assets = [
  // Top-level assets
  {
    name: "EVA Floating (No BG)",
    path: "/images/eva assets/eva-floating-no-bg.png"
  },
  {
    name: "EVA BG",
    path: "/images/eva assets/eva-bg.png"
  },
  {
    name: "EVA PFP",
    path: "/images/eva assets/eva-pfp.png"
  },
  {
    name: "EVA Twitter Banner",
    path: "/images/eva assets/eva-twitter-banner.png"
  },
  // Logo SVGs
  {
    name: "Logo Black (SVG)",
    path: "/images/eva assets/logo/svg/logo-black.svg"
  },
  {
    name: "Logo White (SVG)",
    path: "/images/eva assets/logo/svg/logo-white.svg"
  },
  {
    name: "Logo Extended Black (SVG)",
    path: "/images/eva assets/logo/svg/logo-extended-black.svg"
  },
  {
    name: "Logo Extended White (SVG)",
    path: "/images/eva assets/logo/svg/logo-extended-white.svg"
  },
  {
    name: "Logo Text Black (SVG)",
    path: "/images/eva assets/logo/svg/logo-text-black.svg"
  },
  {
    name: "Logo Text White (SVG)",
    path: "/images/eva assets/logo/svg/logo-text-white.svg"
  },
  // Logo PNGs
  {
    name: "Logo Black (PNG)",
    path: "/images/eva assets/logo/png/logo-black.png"
  },
  {
    name: "Logo White (PNG)",
    path: "/images/eva assets/logo/png/logo-white.png"
  },
  {
    name: "Logo Extended Black (PNG)",
    path: "/images/eva assets/logo/png/logo-extended-black.png"
  },
  {
    name: "Logo Extended White (PNG)",
    path: "/images/eva assets/logo/png/logo-extended-white.png"
  },
  {
    name: "Logo Text Black (PNG)",
    path: "/images/eva assets/logo/png/logo-text-black.png"
  },
  {
    name: "Logo Text White (PNG)",
    path: "/images/eva assets/logo/png/logo-text-white.png"
  },
];

export default function AssetsPage() {
  return (
    <div className="relative bg-top p-4 min-h-screen md:min-h-auto md:pb-[200px]">
      <Navbar inverse />
      <div className="flex flex-col lg:flex-row justify-center text-[#48333D] gap-8 lg:gap-16 max-w-6xl mx-auto pt-16 px-4">
        <div className="flex flex-col w-full">
          <h1 className="text-3xl lg:text-4xl font-bold uppercase mb-2">EVA Brand Assets</h1>
          <p className="text-base lg:text-lg mb-2">
            Download official EVA logos, banners, and images for press, community, and creative use.
          </p>
          <div className="text-sm flex items-center gap-2 uppercase mt-2">
            <div className="size-[8px] bg-[#C0C0C0]" />
            curated for the community
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto pt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {assets.map((asset) => (
            <div key={asset.path} className="bg-white/10 rounded-lg p-4 flex flex-col items-center border border-white/20 shadow-md">
              {asset.path.endsWith(".svg") || asset.path.endsWith(".png") ? (
                <img
                  src={asset.path}
                  alt={asset.name}
                  className="w-32 h-32 object-contain mb-3 rounded"
                  loading="lazy"
                />
              ) : null}
              <div className="font-semibold text-center mb-2 text-sm">{asset.name}</div>
              <a
                href={asset.path}
                download
                className="px-4 py-1 rounded bg-[#FF007A] text-white font-bold text-xs hover:bg-[#e6006b] transition-colors"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      </div>
      <div className="text-sm text-center mt-6 text-[#48333D]">
        COPYRIGHT © 2025 EVA ONLINE
      </div>
    </div>
  );
} 