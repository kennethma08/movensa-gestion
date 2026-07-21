'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResent(true);
      } else {
        setError(data.error || 'No se pudo reenviar el mensaje');
      }
    } catch {
      setError('No se pudo reenviar el correo de verificación');
    } finally {
      setIsResending(false);
    }
  };

  // Low #69: Removed min-h-screen — AuthLayout already handles centering
  return (
    <div className="flex items-center justify-center">
      <div className="mx-auto max-w-md text-center space-y-6 p-8">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Revise su correo</h1>
          <p className="text-muted-foreground">
            Le enviamos un enlace de verificación. Revise su bandeja de entrada y úselo para confirmar su correo electrónico.
          </p>
        </div>

        {resent ? (
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <p className="text-sm">Correo de verificación enviado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reenviar correo de verificación
            </Button>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
