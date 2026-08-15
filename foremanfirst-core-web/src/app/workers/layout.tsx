import AppShell from "@/components/layout/AppShell";

export default function WorkersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}