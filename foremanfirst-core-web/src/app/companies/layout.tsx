import AppShell from "@/components/layout/AppShell";

type CompaniesLayoutProps = {
  children: React.ReactNode;
};

export default function CompaniesLayout({
  children,
}: CompaniesLayoutProps) {
  return <AppShell>{children}</AppShell>;
}