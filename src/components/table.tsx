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
            <TableHead className="text-[#48333D]">Total Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((entry, idx) => (
              <TableRow key={entry.userId}>
                <TableCell className="font-medium">{idx + 1}</TableCell>
                <TableCell className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="font-medium">
                    {entry.name || entry.username}
                  </span>
                  {entry.username && (
                    <span className="text-sm text-[#979797]">
                      @{entry.username}
                    </span>
                  )}
                </TableCell>
                <TableCell>{formatNumber(entry.totalPoints)}</TableCell>
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
