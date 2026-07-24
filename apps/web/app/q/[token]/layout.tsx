import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ver cotización',
  description: 'Revise, descargue y responda su cotización',
  robots: {
    index: false,
    follow: false,
  },
};

export default function QuotePortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="from-muted/30 to-background min-h-screen bg-gradient-to-b">{children}</div>
  );
}
