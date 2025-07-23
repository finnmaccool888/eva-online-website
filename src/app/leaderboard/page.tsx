"use client";

import Navbar from "@/components/navbar";
import Info from "@/components/info";
import Stats from "@/components/stats";
import TableDemo from "@/components/table";
import { AnimatePresence } from "framer-motion";
import { useLeaderboard } from "@/lib/hooks/useLeaderboard";
import Loading from "../loading";

export default function Leaderboard() {
  const { isLoading } = useLeaderboard();
  return (
    <div className="relative bg-top p-4 min-h-screen md:min-h-auto md:pb-[200px]">
      <Navbar inverse />
      <Info />
      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto pt-16">
        <Stats />
        <TableDemo />
      </div>
      <div className="text-sm text-center mt-6 text-[#48333D]">
        COPYRIGHT © 2025 EVA ONLINE
      </div>
      <AnimatePresence>{isLoading && <Loading />}</AnimatePresence>
    </div>
  );
}
