"use client";

import { usePathname } from "next/navigation";

const pageLabels: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  "/dashboard": {
    title: "Command",
    description: "See what is happening and what needs your attention.",
  },

  "/projects": {
    title: "Projects",
    description: "Manage projects, readiness, and active work.",
  },

  "/companies": {
    title: "Companies",
    description: "Manage organizations connected to your projects.",
  },

  "/contractors": {
    title: "Contractors",
    description: "Manage contractor readiness and compliance.",
  },

  "/workers": {
    title: "Workers",
    description: "Manage workers, credentials, and project access.",
  },

  "/settings": {
    title: "Settings",
    description: "Manage your Qoreva workspace.",
  },
};

function getPageInformation(
  pathname: string,
) {
  const exactMatch =
    pageLabels[pathname];

  if (exactMatch) {
    return exactMatch;
  }

  const matchingRoute =
    Object.keys(pageLabels).find(
      (route) =>
        route !== "/dashboard" &&
        pathname.startsWith(
          `${route}/`,
        ),
    );

  if (matchingRoute) {
    return pageLabels[
      matchingRoute
    ];
  }

  return {
    title: "Qoreva",
    description:
      "Work readiness, safety, and field operations.",
  };
}

export default function Header() {
  const pathname =
    usePathname();

  const page =
    getPageInformation(
      pathname,
    );

  return (
    <header
      className="
        sticky
        top-0
        z-30
        border-b
        border-[var(--qoreva-border)]
        bg-[rgba(244,241,234,0.92)]
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          flex
          min-h-[72px]
          w-full
          max-w-[1800px]
          items-center
          justify-between
          gap-4
          px-4
          sm:px-6
          lg:px-7
          xl:px-8
        "
      >
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile Qoreva Mark */}
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-[var(--qoreva-obsidian)]
              text-sm
              font-black
              text-white
              shadow-sm
              lg:hidden
            "
            aria-hidden="true"
          >
            <span className="text-[var(--qoreva-violet)]">
              Q
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1
                className="
                  truncate
                  text-lg
                  font-black
                  tracking-[-0.025em]
                  text-[var(--qoreva-obsidian)]
                  sm:text-xl
                "
              >
                {page.title}
              </h1>

              {pathname ===
              "/dashboard" ? (
                <span
                  className="
                    hidden
                    rounded-full
                    border
                    border-[rgba(102,87,232,0.16)]
                    bg-[var(--qoreva-violet-soft)]
                    px-2
                    py-1
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.10em]
                    text-[var(--qoreva-violet-dark)]
                    sm:inline-flex
                  "
                >
                  Qoreva Command
                </span>
              ) : null}
            </div>

            <p
              className="
                mt-0.5
                hidden
                truncate
                text-xs
                font-medium
                text-[var(--qoreva-muted)]
                sm:block
              "
            >
              {page.description}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Workspace / Project placeholder */}
          <div
            className="
              hidden
              items-center
              gap-3
              rounded-xl
              border
              border-[var(--qoreva-border)]
              bg-white
              px-3.5
              py-2
              shadow-[var(--qoreva-shadow-sm)]
              md:flex
            "
          >
            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                bg-[var(--qoreva-violet-soft)]
                text-[var(--qoreva-violet)]
              "
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M4 20V7.5L12 3l8 4.5V20" />
                <path d="M8 20v-6h8v6" />
              </svg>
            </div>

            <div>
              <p
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-[var(--qoreva-subtle)]
                "
              >
                Workspace
              </p>

              <p
                className="
                  text-xs
                  font-black
                  text-[var(--qoreva-obsidian)]
                "
              >
                Qoreva
              </p>
            </div>
          </div>

          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="
              relative
              inline-flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-[var(--qoreva-border)]
              bg-white
              text-[var(--qoreva-text)]
              shadow-[var(--qoreva-shadow-sm)]
              transition-all
              duration-150

              hover:border-[rgba(102,87,232,0.22)]
              hover:text-[var(--qoreva-violet)]
              hover:shadow-[var(--qoreva-shadow)]
            "
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-[18px] w-[18px]"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>

            <span
              className="
                absolute
                right-2
                top-2
                h-2
                w-2
                rounded-full
                border-2
                border-white
                bg-[var(--qoreva-violet)]
              "
              aria-hidden="true"
            />
          </button>

          {/* Profile */}
          <button
            type="button"
            aria-label="Open profile"
            className="
              inline-flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[var(--qoreva-obsidian)]
              text-xs
              font-black
              text-white
              shadow-sm
              transition-all
              duration-150

              hover:ring-4
              hover:ring-[rgba(102,87,232,0.10)]
            "
          >
            RW
          </button>
        </div>
      </div>
    </header>
  );
}