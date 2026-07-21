'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMessage(data.message || '¡Correo verificado correctamente!');
        } else {
          setStatus('error');
          setMessage(data.error || 'No se pudo verificar el correo');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Ocurrió un error. Inténtelo nuevamente.');
      });
  }, [token]);

  return (
    <div className="mx-auto max-w-md text-center space-y-6 p-8">
      {status === 'loading' && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando su correo...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">¡Correo verificado!</h1>
            <p className="text-muted-foreground">{message}</p>
          </div>
          <Button asChild>
            <Link href="/login">Continuar al inicio de sesión</Link>
          </Button>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-destructive">La verificación falló</h1>
            <p className="text-muted-foreground">{message}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/verify-email">Reenviar verificación</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Volver al inicio de sesión</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Suspense
        fallback={
          <div className="mx-auto max-w-md text-center space-y-6 p-8">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        }
      >
        <ConfirmEmailContent />
      </Suspense>
    </div>
  );
}
