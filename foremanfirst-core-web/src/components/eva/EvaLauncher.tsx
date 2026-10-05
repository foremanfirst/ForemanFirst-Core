"use client";

import { useEva } from "./EvaProvider";

export default function EvaLauncher() {
  const { isOpen, toggleEva } =
    useEva();

  if (isOpen) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleEva}
      aria-label="Open EVA"
      className="
        fixed
        bottom-5
        right-5
        z-50
        inline-flex
        min-h-12
        items-center
        gap-2
        rounded-2xl
        bg-[var(--qoreva-obsidian)]
        px-4
        py-3
        text-sm
        font-black
        text-white
        shadow-xl
        transition
        hover:-translate-y-0.5
        lg:bottom-6
        lg:right-6
      "
    >
      <span
        className="
          flex
          h-7
          w-7
          items-center
          justify-center
          rounded-lg
          bg-[var(--qoreva-violet)]
          text-xs
        "
        aria-hidden="true"
      >
        E
      </span>

      <span>EVA</span>
    </button>
  );
}
