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
              <TableHead className="w-40" />
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
            <TableHead className="w-20" />
            <TableHead className="text-[#48333D] text-right w-20">
              Total Points
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((entry, idx) => (
              <TableRow key={entry.userId} className="items-center">
                <TableCell className="font-medium align-middle text-center">
                  {idx + 1}
                </TableCell>
                <TableCell className="align-middle text-center max-w-[220px]">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1 max-w-[220px]">
                    <span
                      className="font-medium whitespace-nowrap truncate"
                      title={entry.name || entry.username}
                    >
                      {entry.name || entry.username}
                    </span>
                    {entry.username && (
                      <span className="text-sm text-[#979797] whitespace-nowrap">
                        @{entry.username}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="align-middle text-center w-20">
                  <div className="flex justify-center items-center w-full h-full">
                    <div className="relative">
                      <button
                        className="group relative flex items-center justify-center px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 shadow-none opacity-70 hover:opacity-100 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-600/20 hover:shadow-[0_0_12px_2px_rgba(239,68,68,0.25)] transition-all duration-300 font-medium text-red-500/80 hover:text-red-500 text-sm tracking-wide overflow-hidden"
                        style={{ minWidth: 80 }}
                        onClick={() => {
                          const url = `https://songjam.space/flags?userId=${entry.userId}`;
                          window.open(
                            url,
                            "ScorePopup",
                            "width=400,height=700,noopener,noreferrer"
                          );
                        }}
                      >
                        <span className="relative z-10 group-hover:scale-105 transition-transform duration-200 flex items-center gap-1.5">
                          <svg
                            className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                            <line x1="4" y1="22" x2="4" y2="15" />
                          </svg>
                          <span>Flag</span>
                        </span>
                        <span className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-red-500/10 transition-colors duration-300 blur-sm" />
                      </button>
                      {!!entry.flagCount && entry.flagCount > 0 && (
                        <div className="absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-red-500/60 text-white text-[10px] font-bold border-2 border-white/60 shadow-sm opacity-70 group-hover:opacity-100 group-hover:bg-red-500 group-hover:border-white transition-all duration-300">
                          {entry.flagCount}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="align-middle text-right w-20">
                  {formatNumber(entry.totalPoints)}
                </TableCell>
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
