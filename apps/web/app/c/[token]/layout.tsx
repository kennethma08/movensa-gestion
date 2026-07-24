import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Firmar contrato',
  description: 'Revise y firme su contrato',
  robots: { index: false, follow: false },
};

export default function ContractPortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
