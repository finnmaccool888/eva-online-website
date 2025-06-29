import { AspectRatio } from "./ui/aspect-ratio";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export default function VideoDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[1400px] min-w-[90vw] bg-white/10 border border-white/10 backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle>Video</DialogTitle>
        </DialogHeader>
        <AspectRatio ratio={560 / 315} className="w-full h-full">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/OuBA5uqoblY?si=uALB93TC0aT10Bzo"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </AspectRatio>
      </DialogContent>
    </Dialog>
  );
}
