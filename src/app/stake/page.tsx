"use client";

import Navbar from "@/components/navbar";
import Corners from "@/components/corners";

export default function Stake() {
  return (
    <div className="relative bg-top p-4 min-h-screen md:min-h-auto md:pb-[200px]">
      <Navbar inverse />

      <div className="flex flex-col lg:flex-row justify-center text-[#48333D] gap-8 lg:gap-16 max-w-6xl mx-auto pt-16 px-4">
        {/* Left side - Staking Information */}
        <div className="flex flex-col w-full lg:w-1/2">
          <h1 className="text-3xl lg:text-4xl font-bold uppercase mb-6">
            EVA Staking
          </h1>

          <div className="space-y-6">
            {/* EVA Stake Multiplier Bonus */}
            <div className="relative">
              {/* <Corners /> */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#FF007A]">
                  EVA Stake Multiplier Bonus
                </h3>
                <p className="text-sm lg:text-base">
                  Stake your EVA tokens to earn multiplier bonuses. The longer
                  you stake, the higher your multiplier becomes, maximizing your
                  rewards and earning potential.
                </p>
              </div>
            </div>

            {/* Mystery Stake Bonus */}
            <div className="relative ">
              {/* <Corners /> */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#FF007A]">
                  Mystery Stake Bonus
                </h3>
                <p className="text-sm lg:text-base">
                  Unlock exclusive mystery bonuses through strategic staking.
                  Special rewards and rare bonuses await those who participate
                  in our mystery stake program.
                </p>
              </div>
            </div>

            {/* IP Activation */}
            <div className="relative ">
              {/* <Corners /> */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#FF007A]">
                  IP Activation
                </h3>
                <p className="text-sm lg:text-base">
                  Activate your intellectual property rights through staking.
                  Gain access to exclusive content, early features, and special
                  privileges within the EVA ecosystem.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Video */}
        <div className="flex flex-col w-full lg:w-1/2">
          <div className="relative p-6">
            <Corners />
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#FF007A]">
                Staking Tutorial
              </h3>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                  poster="/images/banner.png"
                >
                  <source src="/evastake.mov" type="video/quicktime" />
                  <source src="/evastake.mov" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <p className="text-sm text-center">
                Watch our comprehensive guide to understand the staking process
                and maximize your rewards.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-center mt-6 text-[#48333D]">
        COPYRIGHT © 2025 EVA ONLINE
      </div>
    </div>
  );
}
