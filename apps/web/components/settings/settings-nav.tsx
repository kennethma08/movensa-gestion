'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  Palette,
  Receipt,
  FileText,
  CreditCard,
  Percent,
  Mail,
  Users,
  Settings2,
  UserCircle,
  Eye,
  ListChecks,
  PenLine,
  Webhook,
  Blocks,
  KeyRound,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SettingsNavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export const settingsNavItems: SettingsNavItem[] = [
  { href: '/settings/account', icon: UserCircle, label: 'Cuenta' },
  { href: '/settings/business', icon: Building2, label: 'Datos del negocio' },
  { href: '/settings/branding', icon: Palette, label: 'Identidad visual' },
  { href: '/settings/appearance', icon: Eye, label: 'Apariencia' },
  { href: '/settings/payments', icon: CreditCard, label: 'Pagos' },
  { href: '/settings/team', icon: Users, label: 'Equipo' },
  { href: '/settings/quotes', icon: FileText, label: 'Cotizaciones' },
  { href: '/settings/contracts', icon: PenLine, label: 'Contratos' },
  { href: '/settings/invoices', icon: Receipt, label: 'Facturas' },
  { href: '/settings/tax-rates', icon: Percent, label: 'Impuestos' },
  { href: '/settings/custom-fields', icon: ListChecks, label: 'Campos personalizados' },
  { href: '/settings/emails', icon: Mail, label: 'Correos' },
  { href: '/settings/webhooks', icon: Webhook, label: 'Webhooks' },
  { href: '/settings/integrations', icon: Blocks, label: 'Integraciones' },
  { href: '/settings/api', icon: KeyRound, label: 'Claves API' },
  { href: '/settings/workspace', icon: Settings2, label: 'Espacio de trabajo' },
];

export function SettingsNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/settings/account') {
      return pathname === '/settings/account' || pathname === '/settings';
    }
    return pathname.startsWith(href);
  };

  const currentItem = settingsNavItems.find((item) => isActive(item.href));

  return (
    <>
      {/* Mobile: Select dropdown */}
      <div className="md:hidden">
        <Select
          value={currentItem?.href ?? '/settings/account'}
          onValueChange={(value) => router.push(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccione una sección" />
          </SelectTrigger>
          <SelectContent>
            {settingsNavItems.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Sidebar nav */}
      <nav className="hidden md:flex flex-col gap-0.5">
        {settingsNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
