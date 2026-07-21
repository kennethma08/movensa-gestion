'use client';

import { useState, useTransition } from 'react';
import { Mail, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { sendSigningOtp, verifySigningOtpAction } from '@/lib/signing/actions';
import { toast } from 'sonner';

interface SigningOtpGateProps {
  type: 'quote' | 'contract';
  accessToken: string;
  clientEmail: string;
  onVerified: () => void;
}

/**
 * Email OTP verification gate shown before the signature pad.
 * The signer must verify their email before they can sign.
 */
export function SigningOtpGate({
  type,
  accessToken,
  clientEmail,
  onVerified,
}: SigningOtpGateProps) {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [code, setCode] = useState('');
  const [isPending, startTransition] = useTransition();

  // Mask email for display: a***@example.com
  const maskedEmail = clientEmail.replace(
    /^(.{1,2})(.*)(@.*)$/,
    (_, start, middle, domain) => `${start}${'*'.repeat(Math.min(middle.length, 5))}${domain}`
  );

  // CR #18: Wrap in try/catch to handle network failures — useTransition won't catch them
  const handleSendOtp = () => {
    startTransition(async () => {
      try {
        const result = await sendSigningOtp({ type, accessToken });
        if (result.success) {
          toast.success('Código de verificación enviado a su correo');
          setStep('verify');
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error('Error de red. Revise su conexión e inténtelo nuevamente.');
      }
    });
  };

  const handleVerifyOtp = () => {
    if (code.length !== 6) {
      toast.error('Ingrese el código de 6 dígitos');
      return;
    }

    startTransition(async () => {
      try {
        const result = await verifySigningOtpAction({
          type,
          accessToken,
          code: code.trim(),
          email: clientEmail,
        });
        if (result.success) {
          toast.success('Identidad verificada');
          onVerified();
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error('Error de red. Revise su conexión e inténtelo nuevamente.');
      }
    });
  };

  const handleResend = () => {
    setCode('');
    handleSendOtp();
  };

  if (step === 'request') {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Verifique su identidad</CardTitle>
          <CardDescription>
            Antes de firmar, necesitamos verificar su identidad. Enviaremos un
            código de verificación a <strong>{maskedEmail}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleSendOtp} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar código de verificación
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Ingrese el código de verificación</CardTitle>
        <CardDescription>
          Enviamos un código de 6 dígitos a <strong>{maskedEmail}</strong>.
          Revise su bandeja de entrada e ingréselo a continuación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs mx-auto space-y-2">
          <Label htmlFor="otp-code">Código de verificación</Label>
          <Input
            id="otp-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="text-center text-2xl tracking-widest font-mono"
            maxLength={6}
            autoFocus
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && code.length === 6) {
                handleVerifyOtp();
              }
            }}
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button onClick={handleVerifyOtp} disabled={isPending || code.length !== 6}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verificar
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={isPending}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ¿No recibió el código? Reenviar
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
