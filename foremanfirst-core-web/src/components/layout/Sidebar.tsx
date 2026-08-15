"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    label: "Command",
    href: "/dashboard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Projects",
    href: "/projects",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M4 20V7.5L12 3l8 4.5V20" />
        <path d="M8 20v-6h8v6" />
        <path d="M8 9h.01M12 9h.01M16 9h.01" />
      </svg>
    ),
  },
  {
    label: "Companies",
    href: "/companies",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
        <path d="M16 9h2a2 2 0 0 1 2 2v10" />
        <path d="M8 7h4M8 11h4M8 15h4" />
      </svg>
    ),
  },
  {
    label: "Contractors",
    href: "/contractors",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M16 11h6" />
      </svg>
    ),
  },
  {
    label: "Workers",
    href: "/workers",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
  {
    label: "Planning",
    href: "/planning",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 11h5" />
        <path d="M8 15h3" />
        <path d="m14 15 2 2 4-4" />
      </svg>
    ),
  },
];

const settingsItem: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />

      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V9.6h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.15.37.36.7.6 1 .29.35.68.57 1.1.6h.1v4h-.1a1.7 1.7 0 0 0-1.7.4Z" />
    </svg>
  ),
};

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  function renderNavItem(item: NavItem) {
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`
          group
          relative
          flex
          min-h-11
          items-center
          gap-3
          rounded-xl
          px-3
          py-2.5
          text-sm
          font-bold
          transition-all
          duration-150

          ${
            active
              ? `
                  bg-[var(--qoreva-violet)]
                  text-white
                  shadow-[0_8px_24px_rgba(102,87,232,0.20)]
                `
              : `
                  text-white/70
                  hover:bg-white/[0.06]
                  hover:text-white
                `
          }
        `}
      >
        <span
          className={`
            flex
            h-5
            w-5
            shrink-0
            items-center
            justify-center
            transition-colors

            ${
              active
                ? "text-white"
                : "text-white/55 group-hover:text-white"
            }
          `}
        >
          {item.icon}
        </span>

        <span className="truncate">
          {item.label}
        </span>

        {active ? (
          <span
            className="
              absolute
              right-3
              h-1.5
              w-1.5
              rounded-full
              bg-white/80
            "
            aria-hidden="true"
          />
        ) : null}
      </Link>
    );
  }

  return (
    <aside
      className="
        sticky
        top-0
        flex
        h-screen
        w-64
        shrink-0
        flex-col
        overflow-hidden
        bg-[var(--qoreva-obsidian)]
        text-white
      "
    >
      {/* Ambient Qoreva glow */}
      <div
        className="
          pointer-events-none
          absolute
          -left-16
          -top-24
          h-64
          w-64
          rounded-full
          bg-[rgba(102,87,232,0.12)]
          blur-3xl
        "
        aria-hidden="true"
      />

      <div className="relative flex h-full flex-col">
        {/* Qoreva Brand */}
        <div className="px-5 pb-5 pt-6">
          <Link
            href="/dashboard"
            className="
              group
              flex
              items-center
              gap-3
              rounded-xl
              outline-none
            "
            aria-label="Qoreva Command"
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-[var(--qoreva-violet)]
                shadow-[0_8px_24px_rgba(102,87,232,0.20)]
              "
            >
              <span className="text-xl font-black tracking-[-0.08em]">
                Q
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-start">
                <span
                  className="
                    text-[17px]
                    font-black
                    tracking-[0.08em]
                    text-white
                  "
                >
                  QOREVA
                </span>

                <span
                  className="
                    ml-0.5
                    mt-0.5
                    text-[8px]
                    font-bold
                    text-[#B9B0FF]
                  "
                >
                  ™
                </span>
              </div>

              <p
                className="
                  mt-0.5
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-white/40
                "
              >
                Build Safer. Build Smarter.
              </p>
            </div>
          </Link>
        </div>

        <div className="mx-5 border-t border-white/[0.07]" />

        {/* Workspace Label */}
        <div className="px-5 pb-2 pt-5">
          <p
            className="
              px-3
              text-[9px]
              font-black
              uppercase
              tracking-[0.18em]
              text-white/30
            "
          >
            Workspace
          </p>
        </div>

        {/* Main Navigation */}
        <nav
          className="
            flex-1
            space-y-1
            overflow-y-auto
            px-3
            pb-4
          "
          aria-label="Main navigation"
        >
          {navItems.map(renderNavItem)}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-white/[0.07] p-3">
          {renderNavItem(settingsItem)}

          {/* User */}
          <div
            className="
              mt-3
              rounded-2xl
              border
              border-white/[0.07]
              bg-white/[0.035]
              p-3
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[var(--qoreva-violet)]
                  text-xs
                  font-black
                  text-white
                "
              >
                RW
              </div>

              <div className="min-w-0">
                <p
                  className="
                    truncate
                    text-xs
                    font-black
                    text-white
                  "
                >
                  Robert Willis
                </p>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-[10px]
                    font-medium
                    text-white/45
                  "
                >
                  Safety Manager
                </p>
              </div>

              <svg
                className="
                  ml-auto
                  h-4
                  w-4
                  shrink-0
                  text-white/30
                "
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  d="m9 18 6-6-6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}