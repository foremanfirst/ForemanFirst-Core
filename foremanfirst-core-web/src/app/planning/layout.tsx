import AppShell from "@/components/layout/AppShell";

export default function PlanningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}