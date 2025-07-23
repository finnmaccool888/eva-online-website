import { Badge } from "@/components/ui/badge"

interface EVAOGBadgeProps {
  size?: "small" | "medium" | "large"
}

export function EVAOGBadge({ size = "medium" }: EVAOGBadgeProps) {
  const sizeClasses = {
    small: "text-xs px-2 py-1",
    medium: "text-sm px-3 py-1",
    large: "text-lg px-6 py-3",
  }

  const iconSizes = {
    small: "12px",
    medium: "16px",
    large: "24px",
  }

  return (
    <Badge
      className={`
        bg-white/60 backdrop-blur-sm
        text-gray-800 border border-white/70 font-bold
        hover:bg-white/80
        ${sizeClasses[size]}
      `}
    >
      <span style={{ fontSize: iconSizes[size] }} className="mr-2">
        🧬
      </span>
      EVA OG
    </Badge>
  )
} 