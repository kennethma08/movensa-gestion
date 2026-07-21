import '@/lib/env'; // Must be first — trims \n from all env vars
import { getBaseUrl } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { FontSizeProvider } from '@/components/providers/font-size-provider';
import { SessionProvider } from '@/components/providers/session-provider';
import { UiProvider } from '@/components/providers/ui-provider';
import { GlobalErrorHandler } from '@/components/providers/global-error-handler';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Movensa Gestión',
    template: '%s | Movensa Gestión',
  },
  description: 'Sistema privado de cotizaciones, clientes, contratos y facturación de Grupo Movensa.',
  authors: [{ name: 'Grupo Movensa' }],
  creator: 'Grupo Movensa',
  publisher: 'Grupo Movensa',
  metadataBase: new URL(getBaseUrl()),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
  category: 'Sistema administrativo',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
        >
          Ir al contenido principal
        </a>
        <SessionProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <FontSizeProvider>
                <UiProvider>
                  {children}
                  <GlobalErrorHandler />
                  <Toaster richColors position="top-right" />
                </UiProvider>
              </FontSizeProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
