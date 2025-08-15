import { Button } from "./ui/button";
import PrimaryButton from "./primary-button";
import Link from "next/link";
import AboutDialog from "./about-dialog";
import { Menu } from "lucide-react";
import { MobileMenu } from "./mobile-menu";
import Logo from "./logo";
import { cn } from "@/lib/utils";
import VirtualsIcon from "./virtuals-icon";

export default function Navbar({ inverse }: { inverse?: boolean }) {
  return (
    <div className="flex justify-between items-center rounded-[12px] max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Logo
            className={cn(
              inverse ? "text-[#48333D]" : "text-primary",
              "w-[36px]"
            )}
          />
          <div
            className={`hidden md:block text-xl font-bold ${
              inverse ? "text-[#48333D]" : ""
            }`}
          >
            EVA ONLINE
          </div>
        </Link>
      </div>
      <div className="hidden md:flex gap-4 items-center">
        <AboutDialog>
          <Button
            variant="ghost"
            className={inverse ? "text-[#48333D] hover:text-[#48333D]/60" : ""}
          >
            ABOUT
          </Button>
        </AboutDialog>
        <Link href="/mirror">
          <Button
            variant="ghost"
            className={inverse ? "text-[#48333D] hover:text-[#48333D]/60" : ""}
          >
            MIRROR
          </Button>
        </Link>
        <Link href="/profile">
          <Button
            variant="ghost"
            className={inverse ? "text-[#48333D] hover:text-[#48333D]/60" : ""}
          >
            PROFILE
          </Button>
        </Link>
        <Link href="/stake">
          <Button
            variant="ghost"
            className={inverse ? "text-[#48333D] hover:text-[#48333D]/60" : ""}
          >
            STAKE
          </Button>
        </Link>
        <Link
          href="https://eva-online.gitbook.io/eva-agent-online"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="ghost"
            className={inverse ? "text-[#48333D] hover:text-[#48333D]/60" : ""}
          >
            GITBOOK
          </Button>
        </Link>
        <Link href="/assets">
          <Button
            variant="ghost"
            className={inverse ? "text-[#48333D] hover:text-[#48333D]/60" : ""}
          >
            ASSETS
          </Button>
        </Link>
        <Link href="/og-wall">
          <Button
            variant="ghost"
            className={inverse ? "text-[#48333D] hover:text-[#48333D]/60" : ""}
          >
            OG WALL
          </Button>
        </Link>
        <Link
          href="https://x.com/evaonlinexyz"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            size="icon"
            variant="ghost"
            className={`w-auto h-auto text-[20px] ${
              inverse ? "text-[#48333D] hover:text-[#48333D]/60" : ""
            }`}
          >
            𝕏
          </Button>
        </Link>
        <Link
          href="https://app.virtuals.io/geneses/6030"
          target="_blank"
          rel="noopener noreferrer"
          className="flex"
        >
          <Button
            size="icon"
            variant="ghost"
            className={`w-auto h-auto ${
              inverse ? "text-[#48333D] hover:text-[#48333D]/60" : ""
            }`}
          >
            <VirtualsIcon className="scale-150" />
          </Button>
        </Link>
      </div>
      <div className="hidden md:block">
        <Link
          href="https://app.virtuals.io/geneses/6030"
          target="_blank"
          rel="noopener noreferrer"
        >
          <PrimaryButton inverse={inverse}>GO TO LAUNCH</PrimaryButton>
        </Link>
      </div>
      <div className="md:hidden">
        <MobileMenu inverse={inverse}>
          <Menu size={24} className={inverse ? "text-[#48333D]" : ""} />
        </MobileMenu>
      </div>
    </div>
  );
}
