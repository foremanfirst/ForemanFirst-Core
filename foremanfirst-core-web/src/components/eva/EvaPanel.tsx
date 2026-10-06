"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useEva } from "./EvaProvider";

export default function EvaPanel() {
  const {
    isOpen,
    closeEva,
    draft,
    messages,
    pageContext,
    setDraft,
    addMessage,
  } = useEva();

  const [isThinking, setIsThinking] =
    useState(false);

  const [copiedMessageId, setCopiedMessageId] =
    useState<string | null>(null);

  const [displayName, setDisplayName] =
    useState<string | null>(null);

  const conversationRef =
    useRef<HTMLDivElement | null>(null);

  const conversationEndRef =
    useRef<HTMLDivElement | null>(null);

  const shouldAutoFollowRef =
    useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function loadIdentity() {
      try {
        const response =
          await fetch("/api/eva", {
            cache: "no-store",
          });

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (
          !cancelled &&
          typeof data?.user?.displayName ===
            "string"
        ) {
          setDisplayName(
            data.user.displayName,
          );
        }
      } catch {
        // Identity is enhancement-only.
      }
    }

    void loadIdentity();

    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = useMemo(() => {
    const hour =
      new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 17) {
      return "Good afternoon";
    }

    return "Good evening";
  }, []);

  useEffect(() => {
    if (
      !isOpen ||
      !shouldAutoFollowRef.current
    ) {
      return;
    }

    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [isOpen, isThinking, messages]);

  function handleConversationScroll() {
    const element = conversationRef.current;

    if (!element) {
      return;
    }

    const distanceFromBottom =
      element.scrollHeight -
      element.scrollTop -
      element.clientHeight;

    shouldAutoFollowRef.current =
      distanceFromBottom < 80;
  }

  function followConversation() {
    shouldAutoFollowRef.current = true;

    requestAnimationFrame(() => {
      conversationEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }

  const firstName =
    displayName
      ?.trim()
      .split(/\s+/)[0] ?? null;

  if (!isOpen) {
    return null;
  }

  function cleanEvaText(content: string) {
    return content
      .replace(/\*\*([\s\S]*?)\*\*/g, "$1")
      .replace(/__([\s\S]*?)__/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .trim();
  }

  async function copyEvaMessage(
    messageId: string,
    content: string,
  ) {
    try {
      await navigator.clipboard.writeText(
        cleanEvaText(content),
      );

      setCopiedMessageId(messageId);

      window.setTimeout(() => {
        setCopiedMessageId((current) =>
          current === messageId
            ? null
            : current,
        );
      }, 1600);
    } catch {
      // Clipboard access can be unavailable in
      // restricted browser environments.
    }
  }

  async function submitDraft() {
    const content = draft.trim();

    if (!content) {
      return;
    }

    const priorHistory =
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

    addMessage({
      role: "user",
      content,
    });

    setDraft("");
    setIsThinking(true);
    followConversation();

    try {
      const response =
        await fetch("/api/eva", {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            userMessage: content,

            history:
              priorHistory,

            currentModule:
              pageContext.module,

            currentPathname:
              pageContext.pathname,

            currentRecordId:
              pageContext.recordId,
          }),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "EVA was unable to respond.",
        );
      }

      if (
        typeof data?.user?.displayName ===
          "string"
      ) {
        setDisplayName(
          data.user.displayName,
        );
      }

      addMessage({
        role: "assistant",
        content:
          typeof data?.message === "string"
            ? data.message
            : "I wasn't able to generate a response.",
      });
    } catch (error) {
      addMessage({
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "EVA was unable to respond. Please try again.",
      });
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <aside
      className="
        fixed
        inset-y-0
        right-0
        z-50
        flex
        h-dvh
        min-h-0
        w-full
        max-w-md
        flex-col
        overflow-hidden
        border-l
        border-[var(--qoreva-border)]
        bg-white
        shadow-2xl

        lg:sticky
        lg:top-0
        lg:z-20
        lg:h-dvh
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
          shrink-0
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5">
        <div
          className="
            rounded-2xl
            border
            border-[var(--qoreva-border)]
            bg-[var(--qoreva-bone)]
            p-4
          "
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
              {firstName
                ? `${greeting}, ${firstName} 👋`
                : "EVA is ready."}
            </p>

            <span
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-[var(--qoreva-border)]
                bg-white
                px-2.5
                py-1
                text-[10px]
                font-black
                uppercase
                tracking-[0.08em]
                text-[var(--qoreva-muted)]
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[var(--qoreva-success)]
                "
              />
              {isThinking
                ? "Thinking"
                : "Ready"}
            </span>
          </div>

          <p className="mt-1 text-sm leading-6 text-[var(--qoreva-muted)]">
            {firstName
              ? "How can I help you today?"
              : "Ask questions, get planning assistance, and work with Qoreva without leaving your current screen."}
          </p>

          <div
            className="
              mt-4
              rounded-xl
              border
              border-[var(--qoreva-border)]
              bg-white
              px-3
              py-2.5
            "
          >
            <p
              className="
                text-[10px]
                font-black
                uppercase
                tracking-[0.12em]
                text-[var(--qoreva-muted)]
              "
            >
              Viewing
            </p>

            <p className="mt-0.5 text-sm font-black text-[var(--qoreva-obsidian)]">
              {pageContext.moduleLabel}
            </p>
          </div>
        </div>

        <div
          ref={conversationRef}
          onScroll={handleConversationScroll}
          className="
            mt-5
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            pr-1
          "
        >
          {messages.length > 0 ||
          isThinking ? (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-8"
                      : "mr-8"
                  }
                >
                  <div
                    className={
                      message.role === "user"
                        ? "whitespace-pre-wrap rounded-2xl rounded-br-md bg-[var(--qoreva-violet)] px-4 py-3 text-sm leading-6 text-white"
                        : "whitespace-pre-wrap rounded-2xl rounded-bl-md border border-[var(--qoreva-border)] bg-white px-4 py-3 text-sm leading-6 text-[var(--qoreva-text)]"
                    }
                  >
                    {message.role === "assistant"
                      ? cleanEvaText(message.content)
                      : message.content}
                  </div>

                  {message.role === "assistant" ? (
                    <div className="mt-1.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          void copyEvaMessage(
                            message.id,
                            message.content,
                          )
                        }
                        className="
                          rounded-lg
                          px-2
                          py-1
                          text-[11px]
                          font-bold
                          text-[var(--qoreva-muted)]
                          transition
                          hover:bg-[var(--qoreva-bone)]
                          hover:text-[var(--qoreva-obsidian)]
                        "
                      >
                        {copiedMessageId ===
                        message.id
                          ? "Copied ✓"
                          : "Copy"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}

              {isThinking ? (
                <div className="mr-8 rounded-2xl rounded-bl-md border border-[var(--qoreva-border)] bg-white px-4 py-3 text-sm font-bold text-[var(--qoreva-muted)]">
                  EVA is thinking…
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center">
              <p className="max-w-[260px] text-sm leading-6 text-[var(--qoreva-muted)]">
                Your EVA conversation will stay with
                you while you move through Qoreva.
              </p>
            </div>
          )}

          <div
            ref={conversationEndRef}
            aria-hidden="true"
            className="h-px"
          />
        </div>

        <div className="shrink-0 pt-5">
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
              value={draft}
              onChange={(event) =>
                setDraft(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  submitDraft();
                }
              }}
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
              onClick={submitDraft}
              disabled={
                !draft.trim() ||
                isThinking
              }
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
                transition
                disabled:cursor-not-allowed
                disabled:opacity-40
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
