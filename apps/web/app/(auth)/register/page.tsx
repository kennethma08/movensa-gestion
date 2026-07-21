import { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from './register-form';

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Crear la cuenta administrativa de Grupo Movensa',
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta administrativa</h1>
        <p className="text-sm text-muted-foreground">
          Este registro está reservado para Grupo Movensa
        </p>
      </div>

      <RegisterForm />

      <p className="px-8 text-center text-sm text-muted-foreground">
        ¿Ya tiene una cuenta?{' '}
        <Link href="/login" className="underline underline-offset-4 hover:text-primary">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
