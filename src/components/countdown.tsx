"use client";

import { useEffect, useState } from "react";
import moment from "moment";

export default function Countdown() {
  const targetDate = moment.unix(1754022600);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = moment();
      const duration = moment.duration(targetDate.diff(now));

      const days = Math.floor(duration.asDays());
      const hours = duration.hours();
      const minutes = duration.minutes();
      const seconds = duration.seconds();

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="text-2xl md:text-4xl font-bold w-[300px] uppercase">
      {timeLeft || "Calculating..."}
    </div>
  );
}
