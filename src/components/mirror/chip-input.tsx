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
              className="rounded-full border border-gray-300 px-3 py-1 text-sm hover:bg-purple-100 hover:border-purple-300 bg-white text-gray-700"
              onClick={() => appendChip(c)}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <textarea
        className="w-full min-h-24 rounded-md border border-gray-300 bg-white p-3 text-gray-800 placeholder:text-gray-400 focus:border-purple-400 focus:outline-none"
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