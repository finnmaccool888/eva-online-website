export default function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:h-[688px] w-full md:w-[487.5px] bg-white/10 p-8 flex flex-col justify-end rounded-[16px] border border-white/10 backdrop-blur-xs">
      {children}
    </div>
  );
}
