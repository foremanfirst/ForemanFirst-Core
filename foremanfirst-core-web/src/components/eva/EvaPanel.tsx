"use client";

import { useEva } from "./EvaProvider";

export default function EvaPanel() {
  const { isOpen, closeEva } =
    useEva();

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className="
        fixed
        inset-y-0
        right-0
        z-50
        flex
        w-full
        max-w-md
        flex-col
        border-l
        border-[var(--qoreva-border)]
        bg-white
        shadow-2xl

        lg:relative
        lg:z-20
        lg:h-screen
        lg:w-[380px]
        lg:shrink-0
        lg:shadow-none
      "
      aria-label="EVA assistant"
    >
      <div
        className="
          flex
          min-h-[72px]
          items-center
          justify-between
          gap-3
          border-b
          border-[var(--qoreva-border)]
          px-5
        "
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-xl
                bg-[var(--qoreva-violet)]
                text-xs
                font-black
                text-white
              "
            >
              E
            </span>

            <div>
              <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                EVA
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--qoreva-muted)]">
                Qoreva Assistant
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={closeEva}
          aria-label="Close EVA"
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            border
            border-[var(--qoreva-border)]
            text-[var(--qoreva-muted)]
            transition
            hover:text-[var(--qoreva-obsidian)]
          "
        >
          ×
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div
          className="
            rounded-2xl
            border
            border-[var(--qoreva-border)]
            bg-[var(--qoreva-bone)]
            p-4
          "
        >
          <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
            EVA is ready.
          </p>

          <p className="mt-1 text-sm leading-6 text-[var(--qoreva-muted)]">
            Ask questions, get planning assistance,
            and work with Qoreva without leaving
            your current screen.
          </p>
        </div>

        <div className="mt-auto pt-5">
          <div
            className="
              flex
              items-end
              gap-2
              rounded-2xl
              border
              border-[var(--qoreva-border)]
              bg-white
              p-2
              shadow-sm
            "
          >
            <textarea
              rows={1}
              placeholder="Ask EVA..."
              className="
                min-h-10
                flex-1
                resize-none
                bg-transparent
                px-2
                py-2
                text-sm
                outline-none
              "
            />

            <button
              type="button"
              aria-label="Send message"
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-[var(--qoreva-violet)]
                font-black
                text-white
              "
            >
              ↑
            </button>
          </div>

          <p className="mt-2 text-center text-[10px] leading-4 text-[var(--qoreva-subtle)]">
            EVA can assist with your work.
            Review AI-generated information before
            making it part of an official record.
          </p>
        </div>
      </div>
    </aside>
  );
}
