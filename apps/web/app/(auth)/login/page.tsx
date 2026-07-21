import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Acceso al sistema de gestión de Grupo Movensa',
  robots: { index: false, follow: false },
};

function LoginFormFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// Low #68: Redirect logged-in users to dashboard
export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect('/dashboard');
  }
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenido</h1>
        <p className="text-sm text-muted-foreground">
          Ingrese sus datos para acceder al sistema de gestión
        </p>
      </div>

      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>

      <p className="px-8 text-center text-sm text-muted-foreground">
        ¿Aún no ha creado la cuenta administrativa?{' '}
        <Link href="/register" className="underline underline-offset-4 hover:text-primary">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
