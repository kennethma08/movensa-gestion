'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  HelpCircle,
  CreditCard,
  FileText,
  Receipt,
  Eye,
  CheckCircle,
  Banknote,
  XCircle,
} from 'lucide-react';
import { markAllNotificationsRead, markNotificationRead, type NotificationData } from '@/lib/notifications/actions';

import { ThemeToggle } from '@/components/shared/theme-toggle';
import { SearchCommand } from '@/components/shared/search-command';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AppHeaderProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
  unreadCount?: number;
  notifications?: NotificationData[];
}

const notificationIcons: Record<string, typeof Bell> = {
  quote_sent: FileText,
  quote_viewed: Eye,
  quote_accepted: CheckCircle,
  quote_declined: XCircle,
  invoice_sent: Receipt,
  invoice_viewed: Eye,
  invoice_paid: Banknote,
  invoice_overdue: XCircle,
  contract_sent: FileText,
  contract_signed: CheckCircle,
};

function formatTimeAgo(date: Date, now: Date | null): string {
  if (!now) {
    return new Date(date).toLocaleDateString('es-CR', {
      day: 'numeric',
      month: 'short',
      timeZone: 'America/Costa_Rica',
    });
  }
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(date).toLocaleDateString('es-CR', {
    timeZone: 'America/Costa_Rica',
  });
}

function getNotificationReference(notification: NotificationData): string {
  const match = notification.title.match(/(?:Quote|Invoice|Contract|Cotización|Factura|Contrato)\s+([A-Z0-9-]+)/i);
  return match?.[1] ? ` ${match[1]}` : '';
}

function localizeNotification(notification: NotificationData): { title: string; message: string | null } {
  const reference = getNotificationReference(notification);
  const recipient = notification.message?.replace(/^(?:Sent to|Enviada a)\s+/i, '').trim();

  const labels: Record<string, { title: string; message: string }> = {
    quote_sent: { title: `Cotización${reference} enviada`, message: recipient ? `Enviada a ${recipient}` : 'La cotización fue enviada.' },
    quote_viewed: { title: `Cotización${reference} vista`, message: 'El cliente abrió la cotización.' },
    quote_accepted: { title: `Cotización${reference} aceptada`, message: 'El cliente aceptó la cotización.' },
    quote_declined: { title: `Cotización${reference} rechazada`, message: 'El cliente rechazó la cotización.' },
    invoice_sent: { title: `Factura${reference} enviada`, message: recipient ? `Enviada a ${recipient}` : 'La factura fue enviada.' },
    invoice_viewed: { title: `Factura${reference} vista`, message: 'El cliente abrió la factura.' },
    invoice_paid: { title: `Factura${reference} pagada`, message: 'El pago de la factura fue registrado.' },
    invoice_overdue: { title: `Factura${reference} vencida`, message: 'La factura tiene un saldo pendiente vencido.' },
    contract_sent: { title: `Contrato${reference} enviado`, message: 'El contrato fue enviado al cliente.' },
    contract_signed: { title: `Contrato${reference} firmado`, message: 'El cliente firmó el contrato.' },
  };

  return labels[notification.type] || {
    title: notification.title,
    message: notification.message,
  };
}

const pathNameMap: Record<string, string> = {
  dashboard: 'Panel general',
  quotes: 'Cotizaciones',
  invoices: 'Facturas',
  clients: 'Clientes',

  templates: 'Plantillas',
  settings: 'Configuración',
  help: 'Ayuda y soporte',
  new: 'Nuevo',
  edit: 'Editar',
  builder: 'Constructor',
  analytics: 'Analítica',
  projects: 'Proyectos',
  contracts: 'Contratos',
  account: 'Cuenta',
  business: 'Datos del negocio',
  branding: 'Marca',
  team: 'Equipo',
  workspace: 'Espacio de trabajo',
  billing: 'Facturación y suscripción',
  'tax-rates': 'Impuestos',
  emails: 'Plantillas de correo',
  payments: 'Configuración de pagos',
  editor: 'Editor',
};

// Check if a string looks like a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Check if a string looks like an entity ID (e.g., demo-client-1, client-jane, test-project-1)
function isEntityId(str: string): boolean {
  return /^(demo-|client-|test-|invoice-|quote-|contract-)/.test(str);
}

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; href: string; isLast: boolean }[] = [];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    let label: string;
    if (pathNameMap[segment]) {
      label = pathNameMap[segment];
    } else if (isUUID(segment) || isEntityId(segment)) {
      // For UUIDs and demo IDs, show "Details" as the label
      label = 'Detalle';
    } else {
      // Capitalize first letter of each word
      label = segment
        .split(/[-_.]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    breadcrumbs.push({
      label,
      href: currentPath,
      isLast: index === segments.length - 1,
    });
  });

  return breadcrumbs;
}

export function AppHeader({ user, unreadCount = 0, notifications = [] }: AppHeaderProps) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const breadcrumbs = generateBreadcrumbs(pathname);

  // Register Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    setCurrentTime(new Date());
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="bg-card sticky top-0 z-50 border-b">
      <div className="flex items-center justify-between gap-4 px-4 py-2 sm:px-6">
        {/* Left: Sidebar trigger + Breadcrumbs */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="[&_svg]:!size-5" />
          <Separator orientation="vertical" className="hidden !h-4 md:block" />

          {/* Breadcrumbs - hidden on mobile */}
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Inicio</BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.href} className="flex items-center gap-1.5">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Search button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCommandOpen(true)}
            className="md:hidden"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Desktop Search */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="h-4 w-4 mr-2" />
            <span>Buscar</span>
            <kbd className="ml-4 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              ⌘K
            </kbd>
          </Button>

          {/* Search Command Palette */}
          <SearchCommand open={commandOpen} onOpenChange={setCommandOpen} />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end" forceMount>
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificaciones</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => markAllNotificationsRead()}
                  >
                    Marcar todo como leído
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">No hay notificaciones nuevas</p>
                    <p className="text-xs text-muted-foreground">
                      Aquí aparecerán las novedades de su gestión
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const IconComponent = notificationIcons[notification.type] || Bell;
                    const localized = localizeNotification(notification);
                    return (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex items-start gap-3 p-3 cursor-pointer"
                        onClick={() => {
                          if (!notification.isRead) {
                            markNotificationRead(notification.id);
                          }
                          if (notification.link && notification.link.startsWith('/')) {
                            window.location.href = notification.link;
                          }
                        }}
                      >
                        <div className="mt-0.5 shrink-0">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {localized.title}
                          </p>
                          {localized.message && (
                            <p className="text-xs text-muted-foreground truncate">{localized.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatTimeAgo(notification.createdAt, currentTime)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative size-9"
                data-testid="user-menu"
                aria-label="Menú de usuario"
              >
                <Avatar className="size-9 rounded-md">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.name || 'Usuario'} />
                  <AvatarFallback className="rounded-md">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
                <Avatar className="size-10">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.name || 'Usuario'} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name || 'Usuario'}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/settings/account">
                    <User className="mr-2 h-4 w-4" />
                    Mi perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/billing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Facturación
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/help">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Ayuda y soporte
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
