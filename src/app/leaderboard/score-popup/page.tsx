"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function ActionScoreBar({ value, max, onAction, selected }: { value: number; max: number; onAction: (action: string) => void; selected: string | null }) {
  const percent = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const actions = [
    { key: "vouch", label: "Vouch", color: "from-green-400 to-green-600", hover: "hover:opacity-90", tooltip: "Vouch" },
    { key: "review", label: "Review", color: "from-gray-300 to-gray-500", hover: "hover:opacity-90", tooltip: "Review" },
    { key: "slash", label: "Slash", color: "from-red-400 to-red-600", hover: "hover:opacity-90", tooltip: "Slash" },
  ];
  return (
    <div className="relative flex w-full max-w-xs h-8 rounded-full overflow-hidden shadow border border-white/30 select-none">
      {actions.map((action, idx) => (
        <button
          key={action.key}
          className={`flex-1 h-full flex items-center justify-center transition-all duration-200 text-xs font-bold relative group focus:outline-none ${action.key === selected ? 'ring-2 ring-offset-2 ring-[#FF007A] z-10' : ''}`}
          style={{
            background: `linear-gradient(to right, var(--tw-gradient-stops))`,
            ...(action.key === 'vouch' && { '--tw-gradient-from': '#4ade80', '--tw-gradient-to': '#22c55e' }),
            ...(action.key === 'review' && { '--tw-gradient-from': '#d1d5db', '--tw-gradient-to': '#6b7280' }),
            ...(action.key === 'slash' && { '--tw-gradient-from': '#f87171', '--tw-gradient-to': '#dc2626' }),
            border: 'none',
            boxShadow: 'none',
            outline: 'none',
            zIndex: action.key === selected ? 10 : 1,
          } as React.CSSProperties}
          onClick={() => onAction(action.key)}
          aria-label={action.tooltip}
        >
          <span className="z-10 relative group-hover:scale-110 transition-transform duration-150">
            {action.label}
          </span>
          {/* Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap">
            {action.tooltip}
          </span>
        </button>
      ))}
      {/* Score indicator overlay */}
      <div
        className="absolute left-0 top-0 w-full h-full pointer-events-none"
        style={{
          background: 'linear-gradient(to right, #4ade80, #d1d5db 50%, #f87171)',
          opacity: 0.15,
          zIndex: 0,
          borderRadius: 'inherit',
        }}
      />
    </div>
  );
}

export default function ScorePopup() {
  const params = useSearchParams();
  const name = params.get("name") || "Unknown";
  const username = name.startsWith('@') ? name.slice(1) : params.get("username") || "";
  const points = Number(params.get("points")) || 0;
  const max = Number(params.get("max")) || points || 1;
  // Placeholder for voting state
  const [vote, setVote] = useState<null | "vouch" | "slash" | "review">(null);
  const [defendVote, setDefendVote] = useState<null | "defend" | "slash">(null);
  // Get the list of names from the query string (simulate leaderboard order)
  const allNamesRaw = params.get("allNames") || "";
  const allNames = allNamesRaw.split(",").map(n => n.trim()).filter(Boolean);
  const currentIndex = allNames.findIndex(n => n === name);
  let slasher = "Another Yapper";
  if (currentIndex !== -1 && allNames.length > 1) {
    const nextIndex = (currentIndex + 1) % allNames.length;
    slasher = allNames[nextIndex];
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-[#48333D] p-6 font-sans" style={{ minWidth: 320, minHeight: 320 }}>
      <div className="-mt-12 mb-1 text-lg font-semibold truncate max-w-[220px] text-center">
        {username ? (
          <a
            href={`https://x.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1DA1F2] hover:underline"
          >
            @{username}
          </a>
        ) : (
          name
        )}
      </div>
      {/* Combined ActionScoreBar with three actions */}
      <div className="w-full flex flex-row items-center justify-center my-3">
        <ActionScoreBar value={points} max={max} onAction={(action) => setVote(action as "vouch" | "review" | "slash")} selected={vote} />
      </div>
      <div className="w-full mt-2 mb-1">
        <h2 className="text-base font-bold mb-1">
          Another Yapper proposes slashing {username ? `@${username}` : name}
        </h2>
        <div className="text-xs text-gray-700 mb-4">
          This account has been flagged for review. Reason will appear here.
        </div>
        <div className="flex gap-2 mt-4">
          <button
            className={`flex-1 py-2 rounded-lg font-bold transition-colors ${defendVote === "defend" ? "bg-green-500 text-white" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
            onClick={() => setDefendVote("defend")}
          >
            Defend
          </button>
          <button
            className={`flex-1 py-2 rounded-lg font-bold transition-colors ${defendVote === "slash" ? "bg-red-500 text-white" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
            onClick={() => setDefendVote("slash")}
          >
            Slash
          </button>
        </div>
      </div>
      <div className="6 text-xs text-center text-[#979797] w-full border-t border-white/20 pt-3">
        Powered by <a href="https://songjam.space/" target="_blank" rel="noopener noreferrer" className="text-[#FF007A] font-bold hover:underline transition-colors">Songjam</a>
      </div>
    </div>
  );
} 