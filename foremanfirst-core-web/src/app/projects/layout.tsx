import AppShell from "@/components/layout/AppShell";

type ProjectsLayoutProps = {
  children: React.ReactNode;
};

export default function ProjectsLayout({
  children,
}: ProjectsLayoutProps) {
  return <AppShell>{children}</AppShell>;
}