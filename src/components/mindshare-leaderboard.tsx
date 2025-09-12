"use client";
import { motion } from "framer-motion";
import Navbar from "./navbar";
import { useState, useMemo, type ReactNode } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import SeasonTwoBanner from "./season-two-banner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeaderboardRow {
  username: string;
  name: string;
  totalPoints: number;
  userId: string;
  show: boolean;
}

// Mindshare data will be generated dynamically from leaderboard data

// Flexible Space-Filling Treemap Algorithm
function createTreemap(
  items: any[],
  containerWidth: number,
  containerHeight: number
) {
  if (items.length === 0) return [];

  const sortedItems = [...items].sort((a, b) => b.percentage - a.percentage);

  // Use a recursive treemap approach that fills space naturally
  function squarify(
    items: any[],
    x: number,
    y: number,
    width: number,
    height: number
  ): any[] {
    if (items.length === 0) return [];
    if (items.length === 1) {
      return [
        {
          ...items[0],
          x,
          y,
          width,
          height,
        },
      ];
    }

    // Calculate total area for these items
    const totalValue = items.reduce((sum, item) => sum + item.percentage, 0);
    const totalArea = width * height;

    // Decide whether to split horizontally or vertically
    const aspectRatio = width / height;
    const splitVertically = aspectRatio > 1;

    // Find the best split point
    let bestSplit = 1;
    let bestRatio = Infinity;

    for (let i = 1; i < items.length; i++) {
      const leftItems = items.slice(0, i);
      const rightItems = items.slice(i);

      const leftValue = leftItems.reduce(
        (sum, item) => sum + item.percentage,
        0
      );
      const rightValue = rightItems.reduce(
        (sum, item) => sum + item.percentage,
        0
      );

      if (splitVertically) {
        const leftWidth = (leftValue / totalValue) * width;
        const rightWidth = (rightValue / totalValue) * width;

        // Calculate worst aspect ratio in this split
        const leftAspect = Math.max(leftWidth / height, height / leftWidth);
        const rightAspect = Math.max(rightWidth / height, height / rightWidth);
        const worstRatio = Math.max(leftAspect, rightAspect);

        if (worstRatio < bestRatio) {
          bestRatio = worstRatio;
          bestSplit = i;
        }
      } else {
        const leftHeight = (leftValue / totalValue) * height;
        const rightHeight = (rightValue / totalValue) * height;

        // Calculate worst aspect ratio in this split
        const leftAspect = Math.max(width / leftHeight, leftHeight / width);
        const rightAspect = Math.max(width / rightHeight, rightHeight / width);
        const worstRatio = Math.max(leftAspect, rightAspect);

        if (worstRatio < bestRatio) {
          bestRatio = worstRatio;
          bestSplit = i;
        }
      }
    }

    // Split the items
    const leftItems = items.slice(0, bestSplit);
    const rightItems = items.slice(bestSplit);

    const leftValue = leftItems.reduce((sum, item) => sum + item.percentage, 0);
    const rightValue = rightItems.reduce(
      (sum, item) => sum + item.percentage,
      0
    );

    if (splitVertically) {
      const leftWidth = (leftValue / totalValue) * width;
      const rightWidth = (rightValue / totalValue) * width;

      return [
        ...squarify(leftItems, x, y, leftWidth, height),
        ...squarify(rightItems, x + leftWidth, y, rightWidth, height),
      ];
    } else {
      const leftHeight = (leftValue / totalValue) * height;
      const rightHeight = (rightValue / totalValue) * height;

      return [
        ...squarify(leftItems, x, y, width, leftHeight),
        ...squarify(rightItems, x, y + leftHeight, width, rightHeight),
      ];
    }
  }

  // Show as many items as possible (up to 10)
  const itemsToShow = sortedItems.slice(0, Math.min(10, sortedItems.length));

  return squarify(itemsToShow, 0, 0, containerWidth, containerHeight);
}

type Timeframe = "4H" | "24H" | "7D" | "30D" | "ALL";

export default function MindshareLeaderboard({
  projectId,
  timeframes,
  banner,
  backgroundImageUrl,
}: {
  projectId: string;
  timeframes: Array<Timeframe>;
  banner?: ReactNode;
  backgroundImageUrl?: string;
}) {
  const isLight = true;
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(
    timeframes[0]
  );

  // Resolve endpoint per timeframe
  const getEndpointForTimeframe = (timeframe: Timeframe) => {
    // if (timeframe === "4H") {
    //   return `https://songjamspace-leaderboard.logesh-063.workers.dev/${projectId}_hourly`;
    // } else if (timeframe === "24H") {
    //   return `https://songjamspace-leaderboard.logesh-063.workers.dev/${projectId}_daily`;
    // } else if (timeframe === "7D") {
    //   return `https://songjamspace-leaderboard.logesh-063.workers.dev/${projectId}_weekly`;
    // } else if (timeframe === "30D") {
    //   return `https://songjamspace-leaderboard.logesh-063.workers.dev/${projectId}_monthly`;
    // }
    return `http://api.songjam.space/evaonlinexyz/inspace-yaps`;
  };

  // Fetch leaderboard data by timeframe
  const {
    data: leaderboardData,
    isLoading,
    isFetching,
    error,
  } = useQuery<LeaderboardRow[], Error>({
    queryKey: ["leaderboard", selectedTimeframe],
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const endpoint = getEndpointForTimeframe(selectedTimeframe);
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = (await response.json()) as LeaderboardRow[];
      return result.filter((r) => r.show);
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  // Transform leaderboard data to mindshare format and calculate percentages
  const mindshareData = useMemo((): Array<{
    id: string;
    name: string;
    percentage: number;
    points: number;
    description: string;
    contribution?: string;
  }> => {
    if (!leaderboardData || (leaderboardData as LeaderboardRow[]).length === 0)
      return [];

    // Calculate total points across all entries
    const totalPoints = (leaderboardData as LeaderboardRow[]).reduce(
      (sum: number, entry: LeaderboardRow) => sum + entry.totalPoints,
      0
    );

    // Transform and calculate percentages
    return (leaderboardData as LeaderboardRow[])
      .slice(0, 10) // Data is already sorted by points descending; take top 10
      .map((entry: LeaderboardRow, index: number) => {
        const percentage =
          totalPoints > 0 ? (entry.totalPoints / totalPoints) * 100 : 0;

        return {
          id: entry.username,
          name: entry.name || entry.username,
          // contribution: getContributionType(index),
          percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
          points: entry.totalPoints,
          description: `@${entry.username}`,
        };
      });
  }, [leaderboardData]);

  // Calculate treemap layout using improved algorithm
  const treemapItems = useMemo(() => {
    const containerWidth = 1200;
    const containerHeight = 600;
    return createTreemap(mindshareData, containerWidth, containerHeight);
  }, [mindshareData]);

  // Full sorted list for table view (all users)
  const sortedAllUsers = useMemo(() => {
    if (!leaderboardData || (leaderboardData as LeaderboardRow[]).length === 0)
      return [] as LeaderboardRow[];
    return leaderboardData as LeaderboardRow[]; // Already sorted
  }, [leaderboardData]);

  const handleTimeframeChange = (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);
    // Here you would typically fetch new data based on the selected timeframe
    // For now, we'll just update the state
  };

  return (
    <>
      <SeasonTwoBanner />
      <div className="relative bg-top min-h-screen md:min-h-auto md:pb-[50px]">
        {/* Softening overlay for light theme (pharmachainai) */}
        {/* {isLight && (
          <div className="pointer-events-none absolute inset-0 backdrop-blur-sm bg-white/30" />
        )} */}
        {/* Bottom gradient fade overlay */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-40 from-transparent ${
            isLight ? "to-white" : "to-[oklch(0.145_0_0)]"
          }`}
        />

        {/* Treemap Container */}
        <div className="relative z-10 px-4 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h2
                  className="text-xl sm:text-2xl font-bold text-[#48333D]"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  Leaderboard
                </h2>
                {banner && (
                  <div className="w-full sm:flex-1 flex items-center justify-center">
                    {banner}
                  </div>
                )}
                {/* TODO: Enable later */}
                {/* <div className="flex rounded-lg p-1 border border-white bg-white/10 w-full sm:w-auto">
                  {timeframes.map((timeframe) => (
                    <button
                      key={timeframe}
                      onClick={() => handleTimeframeChange(timeframe)}
                      className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm sm:text-base ${
                        selectedTimeframe === timeframe
                          ? "bg-white/20 text-[#48333D] shadow-sm"
                          : "text-[#48333D] hover:text-[#48333D]/80"
                      }`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div> */}
              </div>

              {/* Treemap Canvas */}
              <div className="relative w-full h-[600px] rounded-lg overflow-hidden bg-white/5">
                {treemapItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className={`absolute cursor-pointer transition-all border-2 border-[#48333D]/60 border-t-transparent duration-300 ${
                      selectedItem === item.id
                        ? "ring-4 ring-white ring-opacity-50"
                        : ""
                    } ${
                      hoveredItem === item.id
                        ? "scale-105 z-10"
                        : "hover:scale-102"
                    }`}
                    style={{
                      left: `${(item.x / 1200) * 100}%`,
                      top: `${(item.y / 600) * 100}%`,
                      width: `${(item.width / 1200) * 100}%`,
                      height: `${(item.height / 600) * 100}%`,
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    onClick={() =>
                      setSelectedItem(selectedItem === item.id ? null : item.id)
                    }
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {/* Content */}
                    <div className="absolute inset-0 p-3 flex flex-col justify-between">
                      <div>
                        <div
                          className="font-bold text-sm md:text-base truncate drop-shadow-lg text-[#48333D]"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {item.name}
                        </div>
                        <div
                          className="text-xs truncate drop-shadow-lg text-[#979797]"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {item.description}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className="font-bold text-lg md:text-xl drop-shadow-lg text-[#48333D]"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {item.percentage}%
                        </div>
                        <div
                          className="text-xs drop-shadow-lg text-[#979797]"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {item.points.toLocaleString()} pts
                        </div>
                      </div>
                    </div>

                    {/* Hover/Selected Overlay */}
                    {(hoveredItem === item.id || selectedItem === item.id) && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center rounded bg-white/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* <div
                          className={`text-center p-3 ${
                            isLight ? "text-slate-900" : "text-white"
                          }`}
                        >
                          <div
                            className="font-bold text-base mb-1 drop-shadow-lg"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            {item.name}
                          </div>
                          <div
                            className="text-xs mb-1 drop-shadow-lg"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            {item.contribution}
                          </div>
                          <div
                            className="text-xs opacity-90 leading-tight drop-shadow-lg"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            {item.description}
                          </div>
                        </div> */}
                      </motion.div>
                    )}
                  </motion.div>
                ))}

                {isFetching && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg shadow-md border border-white bg-white/10">
                      <div className="h-4 w-4 rounded-full border-2 border-[#48333D]/60 border-t-transparent animate-spin" />
                      <span
                        className="text-sm text-[#48333D]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        Updating {selectedTimeframe} Leaderboard…
                      </span>
                    </div>
                  </motion.div>
                )}
                {error && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg shadow-md border border-white bg-white/10">
                      <span
                        className="text-sm text-[#48333D]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        Error fetching the Leaderboard for {selectedTimeframe}{" "}
                        timeframe
                      </span>
                    </div>
                  </motion.div>
                )}
                {!isLoading &&
                  !isFetching &&
                  !error &&
                  (!leaderboardData || leaderboardData.length === 0) && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="text-center px-6 py-4 rounded-lg shadow-md border border-white bg-white/10 max-w-md">
                        <div
                          className="text-2xl font-bold text-[#48333D] mb-2"
                          style={{ fontFamily: "Orbitron, sans-serif" }}
                        >
                          Coming Soon
                        </div>
                        <div
                          className="text-sm text-[#48333D]"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          The leaderboard will be available soon. Check back
                          later!
                        </div>
                      </div>
                    </motion.div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="relative z-10 px-4 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold text-[#48333D]"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {selectedTimeframe} Overview
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 border border-white backdrop-blur-lg rounded-xl p-4 text-center">
                <div
                  className="text-2xl font-bold text-[#48333D]"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {leaderboardData?.length || "-"}
                </div>
                <div
                  className="text-[#979797] text-sm"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Contributors
                </div>
              </div>

              <div className="bg-white/10 border border-white backdrop-blur-lg rounded-xl p-4 text-center">
                <div
                  className="text-2xl font-bold text-[#48333D]"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {mindshareData
                    .reduce((sum, item) => sum + item.points, 0)
                    .toLocaleString()}
                </div>
                <div
                  className="text-[#979797] text-sm"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Total Points
                </div>
              </div>

              <div className="bg-white/10 border border-white backdrop-blur-lg rounded-xl p-4 text-center">
                <div
                  className="text-2xl font-bold text-[#48333D]"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {mindshareData[0]?.percentage || 0}%
                </div>
                <div
                  className="text-[#979797] text-sm"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Top Share
                </div>
              </div>

              <div className="bg-white/10 border border-white backdrop-blur-lg rounded-xl p-4 text-center">
                <div
                  className="text-2xl font-bold text-[#48333D]"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {mindshareData[0]?.name || "N/A"}
                </div>
                <div
                  className="text-[#979797] text-sm"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Leader
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Users Table */}
      <div className="px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="w-full overflow-x-auto">
            <Table className="w-full p-4 rounded-lg border border-white bg-white/10 text-[#48333D] min-w-[400px]">
              <TableHeader>
                <TableRow className="text-[#48333D] font-bold">
                  <TableHead className="w-[100px] text-[#48333D]">
                    Rank
                  </TableHead>
                  <TableHead className="text-[#48333D]">Yapper</TableHead>
                  <TableHead className="text-[#48333D] text-right w-20">
                    Total Points
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAllUsers.length > 0 ? (
                  sortedAllUsers.map((u, idx) => (
                    <TableRow key={u.username} className="items-center">
                      <TableCell className="font-medium align-middle text-center">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="align-middle text-center max-w-[220px]">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1 max-w-[220px]">
                          <span
                            className="font-medium whitespace-nowrap truncate z-10"
                            title={u.name || u.username}
                          >
                            {u.name || u.username}
                          </span>
                          {u.username && (
                            <span className="text-sm text-[#979797] whitespace-nowrap">
                              @{u.username}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle text-right w-20">
                        {u.totalPoints.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <div className="text-lg font-semibold text-gray-700">
                        Coming soon
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Leaderboard will be available in the future
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
