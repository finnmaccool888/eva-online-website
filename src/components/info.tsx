import Corners from "./corners";

export default function Info() {
  return (
    <div className="flex flex-col lg:flex-row justify-center text-[#48333D] gap-8 lg:gap-16 max-w-6xl mx-auto pt-16 px-4">
      <div className="flex flex-col w-full">
        <h1 className="text-3xl lg:text-4xl font-bold uppercase">
          Yappers Leaderboard
        </h1>
        <p className="text-base lg:text-lg">
          Top performers in the EVA ecosystem, ranked by total points
        </p>
        <div className="text-sm flex items-center gap-2 uppercase mt-2">
          <div className="size-[8px] bg-[#C0C0C0]" />
          powered by{" "}
          <a
            href="https://songjam.space/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline transition-colors"
          >
            songjam
          </a>
        </div>
      </div>
      <div className="relative items-start w-full justify-start gap-4 p-4 lg:p-6">
        <Corners />
        <p className="text-sm lg:text-base">
          Tag or Quote Tweet{" "}
          <a
            href="https://twitter.com/evaonlinexyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FF007A] font-bold hover:underline transition-colors"
          >
            @evaonlinexyz
          </a>{" "}
          on X. No need to sign-up, as long as the tweet is published on X it is
          being tracked. Claim Eva points from Aug 1st, points are redeemable
          for $EVA.
        </p>
      </div>
    </div>
  );
}
