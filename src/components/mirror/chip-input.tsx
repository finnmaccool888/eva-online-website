"use client";

import { useState } from "react";

export default function ChipInput({
  placeholder,
  chips,
  value,
  onChange,
}: {
  placeholder?: string;
  chips?: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  function appendChip(c: string) {
    const sep = text && !text.endsWith(" ") ? " " : "";
    const next = (text || "") + sep + c;
    setText(next);
    onChange(next);
  }
  return (
    <div className="flex flex-col gap-2">
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c}
              className="rounded-full border border-border px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground bg-muted text-muted-foreground"
              onClick={() => appendChip(c)}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <textarea
        className="w-full min-h-24 rounded-md border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value);
        }}
      />
    </div>
  );
} 