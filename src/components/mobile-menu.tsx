import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import PrimaryButton from "./primary-button";
import AboutDialog from "./about-dialog";

export function MobileMenu({
  children,
  inverse,
}: {
  children: React.ReactNode;
  inverse?: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-screen bg-white/10 border border-white/10 backdrop-blur-lg z-1000"
      >
        <SheetHeader className="mb-6">
          <SheetTitle>
            <div className="flex items-center gap-2">
              <Image src="/images/logo.svg" alt="logo" width={36} height={12} />
              <div
                className={`text-xl font-bold ${
                  inverse ? "text-[#48333D]" : ""
                }`}
              >
                EVA ONLINE
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4">
          <AboutDialog>
            <Button
              variant="ghost"
              inverse={inverse}
              className="w-full justify-start"
            >
              ABOUT
            </Button>
          </AboutDialog>
          <Button
            variant="ghost"
            inverse={inverse}
            className="w-full justify-start"
          >
            LEADERBOARD
          </Button>
          <Link
            href="https://eva-online.gitbook.io/eva-agent-online"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              variant="ghost"
              inverse={inverse}
              className="w-full justify-start"
            >
              GITBOOK
            </Button>
          </Link>
          <Link href="/assets" className="w-full">
            <Button
              variant="ghost"
              inverse={inverse}
              className="w-full justify-start"
            >
              ASSETS
            </Button>
          </Link>
          <Link href="/og-wall" className="w-full">
            <Button
              variant="ghost"
              inverse={inverse}
              className="w-full justify-start"
            >
              OG WALL
            </Button>
          </Link>
          <Link href="/og-checker" className="w-full">
            <Button
              variant="ghost"
              inverse={inverse}
              className="w-full justify-start"
            >
              OG CLAIM
            </Button>
          </Link>
        </div>
        <SheetFooter className="flex-row flex items-center gap-4">
          <PrimaryButton inverse={inverse}>GO TO LAUNCH</PrimaryButton>
          <Link
            href="https://x.com/evaonlinexyz"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="icon"
              variant="ghost"
              inverse={inverse}
              className="w-auto h-auto text-[20px]"
            >
              𝕏
            </Button>
          </Link>
          <Link
            href="https://app.virtuals.io/geneses/6030"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="icon"
              variant="ghost"
              inverse={inverse}
              className="w-auto h-auto"
            >
              <Image
                src="/images/virtuals.svg"
                alt="v"
                width={28}
                height={28}
              />
            </Button>
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
