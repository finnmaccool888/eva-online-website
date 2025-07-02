"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLeaderboard } from "@/lib/hooks/useLeaderboard";
import { formatNumber } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "./ui/dialog";
import { useState } from "react";

function ScoreBar({ value, max, entry }: { value: number; max: number; entry: any }) {
  const percent = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const [hovered, setHovered] = useState(false);
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `/leaderboard/score-popup?name=${encodeURIComponent(entry.name || entry.username)}&points=${encodeURIComponent(entry.totalPoints)}&max=${encodeURIComponent(max)}`;
    window.open(url, 'ScorePopup', 'width=400,height=300,noopener,noreferrer');
  };
  return (
    <div
      className="relative flex items-center justify-center w-full h-4 cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-label="Show score details"
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-32 rounded-full bg-gradient-to-r from-green-400 to-red-400 opacity-30"
      />
      <div
        className={`h-full rounded-full bg-gradient-to-r from-green-400 to-red-400 transition-all duration-300 ${hovered ? 'scale-y-125 shadow-lg opacity-80' : 'opacity-60'}`}
        style={{ width: `${percent * 100}%`, minWidth: 4, maxWidth: 128 }}
      />
      <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-32 rounded-full border border-white/30 pointer-events-none" />
    </div>
  );
}

export default function TableDemo() {
  const { data, isLoading, isError, error } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <Table className="w-full p-4 rounded-lg border border-white bg-white/10 text-[#48333D] min-w-[400px]">
          <TableHeader>
            <TableRow className="text-[#48333D] font-bold">
              <TableHead className="w-[100px] text-[#48333D]">Rank</TableHead>
              <TableHead className="text-[#48333D]">Yapper</TableHead>
              <TableHead className="text-[#48333D]">Score Bar</TableHead>
              <TableHead className="text-[#48333D]">Total Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-red-500">Error: {error?.message}</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table className="w-full p-4 rounded-lg border border-white bg-white/10 text-[#48333D] min-w-[400px]">
        <TableHeader>
          <TableRow className="text-[#48333D] font-bold">
            <TableHead className="w-[100px] text-[#48333D]">Rank</TableHead>
            <TableHead className="text-[#48333D]">Yapper</TableHead>
            <TableHead className="text-[#48333D]">Score Bar</TableHead>
            <TableHead className="text-[#48333D]">Total Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((entry, idx) => (
              <TableRow key={entry.userId} className="items-center">
                <TableCell className="font-medium align-middle text-center">{idx + 1}</TableCell>
                <TableCell className="align-middle text-center max-w-[180px]">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 overflow-x-auto max-w-[170px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    <span className="font-medium whitespace-nowrap">
                      {entry.name || entry.username}
                    </span>
                    {entry.username && (
                      <span className="text-sm text-[#979797] whitespace-nowrap">
                        @{entry.username}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="align-middle text-center w-40">
                  <div className="flex justify-center items-center w-full h-full">
                    <ScoreBar value={entry.totalPoints} max={Math.max(...data.map(e => e.totalPoints))} entry={entry} />
                  </div>
                </TableCell>
                <TableCell className="align-middle text-center">{formatNumber(entry.totalPoints)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
