interface AbilityItemProps {
  title: string;
  description: string;
}

export default function AbilityItem({ title, description }: AbilityItemProps) {
  return (
    <div className="flex flex-col items-start justify-start gap-2 max-w-[260px]">
      <div className="font-bold text-[#48333D]">{title}</div>
      <div className="text-sm text-[#48333D]">{description}</div>
    </div>
  );
}
