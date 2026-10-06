"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

const EVA_SESSION_STORAGE_KEY =
  "qoreva-eva-session-v1";

export type EvaMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type EvaPersistedSession = {
  isOpen: boolean;
  draft: string;
  messages: EvaMessage[];
};

type EvaPageContext = {
  pathname: string;
  module: string;
  moduleLabel: string;
  recordId: string | null;
};

type EvaContextValue = {
  isOpen: boolean;
  draft: string;
  messages: EvaMessage[];
  pageContext: EvaPageContext;
  openEva: () => void;
  closeEva: () => void;
  toggleEva: () => void;
  setDraft: (value: string) => void;
  addMessage: (
    message: Omit<EvaMessage, "id" | "createdAt">,
  ) => void;
  clearConversation: () => void;
};

const EvaContext =
  createContext<EvaContextValue | null>(null);

function titleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function buildPageContext(
  pathname: string,
  planningRecordId: string | null = null,
): EvaPageContext {
  const segments = pathname
    .split("/")
    .filter(Boolean);

  const module =
    segments[0] ?? "dashboard";

  const moduleLabel =
    module === "dashboard"
      ? "Command"
      : titleCase(module);

  /*
   * Support both current Planning record route shapes:
   * /planning/[planningRecordId]
   * /planning/create/[planningRecordId]
   *
   * Reserved route names must never be treated as record IDs.
   */
  let recordId: string | null = null;

  if (module === "planning") {
    /*
     * The Planning creation workspace keeps its authoritative
     * record ID in the planningRecordId query parameter once
     * the draft exists.
     *
     * This value identifies EVA's requested workspace target
     * only. The EVA API independently authorizes record access
     * before any Planning data is supplied to the model.
     */
    if (
      segments[1] === "create" &&
      planningRecordId
    ) {
      recordId = planningRecordId;
    } else if (
      segments[1] === "create" &&
      segments.length >= 3
    ) {
      recordId = segments[2];
    } else if (
      segments.length >= 2 &&
      !["create"].includes(segments[1])
    ) {
      recordId = segments[1];
    }
  }

  return {
    pathname,
    module,
    moduleLabel,
    recordId,
  };
}

function readPersistedSession():
  EvaPersistedSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw =
      window.sessionStorage.getItem(
        EVA_SESSION_STORAGE_KEY,
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw) as Partial<EvaPersistedSession>;

    return {
      isOpen:
        typeof parsed.isOpen === "boolean"
          ? parsed.isOpen
          : false,
      draft:
        typeof parsed.draft === "string"
          ? parsed.draft
          : "",
      messages:
        Array.isArray(parsed.messages)
          ? parsed.messages.filter(
              (message): message is EvaMessage =>
                Boolean(
                  message &&
                    typeof message.id === "string" &&
                    (message.role === "user" ||
                      message.role === "assistant") &&
                    typeof message.content === "string" &&
                    typeof message.createdAt === "string",
                ),
            )
          : [],
    };
  } catch {
    return null;
  }
}

export function EvaProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname =
    usePathname() ?? "/";

  const searchParams =
    useSearchParams();

  const planningRecordId =
    searchParams.get("planningRecordId");

  const [isOpen, setIsOpen] =
    useState(false);

  const [draft, setDraft] =
    useState("");

  const [messages, setMessages] =
    useState<EvaMessage[]>([]);

  const [hasHydrated, setHasHydrated] =
    useState(false);

  useEffect(() => {
    const persisted =
      readPersistedSession();

    if (persisted) {
      setIsOpen(persisted.isOpen);
      setDraft(persisted.draft);
      setMessages(persisted.messages);
    }

    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (
      !hasHydrated ||
      typeof window === "undefined"
    ) {
      return;
    }

    const session: EvaPersistedSession = {
      isOpen,
      draft,
      messages,
    };

    window.sessionStorage.setItem(
      EVA_SESSION_STORAGE_KEY,
      JSON.stringify(session),
    );
  }, [
    isOpen,
    draft,
    messages,
    hasHydrated,
  ]);

  const pageContext = useMemo(
    () =>
      buildPageContext(
        pathname,
        planningRecordId,
      ),
    [
      pathname,
      planningRecordId,
    ],
  );

  const value = useMemo(
    () => ({
      isOpen,
      draft,
      messages,
      pageContext,

      openEva: () =>
        setIsOpen(true),

      closeEva: () =>
        setIsOpen(false),

      toggleEva: () =>
        setIsOpen(
          (current) => !current,
        ),

      setDraft,

      addMessage: (
        message: Omit<
          EvaMessage,
          "id" | "createdAt"
        >,
      ) => {
        setMessages((current) => [
          ...current,
          {
            ...message,
            id: crypto.randomUUID(),
            createdAt:
              new Date().toISOString(),
          },
        ]);
      },

      clearConversation: () => {
        setMessages([]);
        setDraft("");
      },
    }),
    [
      isOpen,
      draft,
      messages,
      pageContext,
    ],
  );

  return (
    <EvaContext.Provider value={value}>
      {children}
    </EvaContext.Provider>
  );
}

export function useEva() {
  const context =
    useContext(EvaContext);

  if (!context) {
    throw new Error(
      "useEva must be used within EvaProvider",
    );
  }

  return context;
}
