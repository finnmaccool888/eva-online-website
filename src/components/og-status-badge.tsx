import { Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OGStatusBadgeProps {
  status: "success" | "error" | "warning";
  label: string;
  className?: string;
}

export default function OGStatusBadge({ status, label, className }: OGStatusBadgeProps) {
  const statusConfig = {
    success: {
      icon: Check,
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    },
    error: {
      icon: X,
      bgColor: "bg-red-100",
      textColor: "text-red-700",
      borderColor: "border-red-200",
    },
    warning: {
      icon: AlertCircle,
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border",
        config.bgColor,
        config.textColor,
        config.borderColor,
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
} 