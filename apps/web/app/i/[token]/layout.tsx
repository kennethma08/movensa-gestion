import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ver factura',
  description: 'Revise, descargue y pague su factura',
  robots: {
    index: false,
    follow: false,
  },
};

export default function InvoicePortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="from-muted/30 to-background min-h-screen bg-gradient-to-b">{children}</div>
  );
}
