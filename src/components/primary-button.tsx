import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { ComponentProps } from "react";

export default function PrimaryButton({
  children,
  size = "default",
  inverse,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "lg";
  inverse?: boolean;
} & ComponentProps<"button">) {
  return (
    <Button
      className={cn(
        "h-[40px] cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]",
        "bg-no-repeat bg-center bg-cover transition-[background-image] duration-300 ease-in-out",
        inverse && "text-primary-foreground",
        size === "lg"
          ? inverse
            ? "bg-[url('/images/button/lg-gradient-inverse.svg')] hover:bg-[url('/images/button/lg-gradient-hover-inverse.svg')] w-[222px]"
            : "bg-[url('/images/button/lg-gradient.svg')] hover:bg-[url('/images/button/lg-gradient-hover.svg')] w-[222px]"
          : inverse
          ? "bg-[url('/images/button/md-gradient-inverse.svg')] hover:bg-[url('/images/button/md-gradient-hover-inverse.svg')] w-[175px]"
          : "bg-[url('/images/button/md-gradient.svg')] hover:bg-[url('/images/button/md-gradient-hover.svg')] w-[175px]",
        className
      )}
      inverse={inverse}
      {...props}
    >
      {children}
    </Button>
  );
}
