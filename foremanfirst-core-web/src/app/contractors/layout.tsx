import AppShell from "@/components/layout/AppShell";

type ContractorsLayoutProps = {
  children: React.ReactNode;
};

export default function ContractorsLayout({
  children,
}: ContractorsLayoutProps) {
  return <AppShell>{children}</AppShell>;
}