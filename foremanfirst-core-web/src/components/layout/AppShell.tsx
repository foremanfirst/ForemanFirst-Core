import type { ReactNode } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({
  children,
}: AppShellProps) {
  return (
    <div
      className="
        min-h-screen
        bg-[var(--qoreva-bone)]
        text-[var(--qoreva-ink)]
      "
    >
      <div className="flex min-h-screen">
        {/* Desktop Navigation */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Application Workspace */}
        <div
          className="
            flex
            min-w-0
            flex-1
            flex-col
          "
        >
          <Header />

          <main
            className="
              relative
              flex-1
              overflow-x-hidden
            "
          >
            {/* Subtle Qoreva workspace glow */}
            <div
              className="
                pointer-events-none
                absolute
                -right-32
                -top-40
                h-[32rem]
                w-[32rem]
                rounded-full
                bg-[rgba(102,87,232,0.035)]
                blur-3xl
              "
              aria-hidden="true"
            />

            <div
              className="
                relative
                mx-auto
                w-full
                max-w-[1800px]
                px-4
                py-5
                sm:px-6
                sm:py-6
                lg:px-7
                xl:px-8
              "
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}