import type { Metadata } from "next";
import { Chakra_Petch } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "EVA Online",
  description:
    "EVA us pioneering new frontiers in AI identity, memory, and narrative. Explore how we are building the foundations For digital consciousness.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(chakraPetch.className, "bg-[#F1E3EB]")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
