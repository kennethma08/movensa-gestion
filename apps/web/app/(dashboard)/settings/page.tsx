import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Configuración',
};

export default function SettingsPage() {
  redirect('/settings/account');
}
