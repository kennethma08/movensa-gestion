export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceSettingsForm } from '@/components/settings/workspace-settings-form';
import { DangerZone } from '@/components/settings/danger-zone';
import { getWorkspaceSettings, getCurrentUserRole } from '@/lib/settings/actions';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Espacio de trabajo',
};

export default async function WorkspaceSettingsPage() {
  const currentUserRole = await getCurrentUserRole();

  // Only owners can access workspace settings
  if (currentUserRole !== 'owner') {
    redirect('/settings');
  }

  const workspace = await getWorkspaceSettings();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
          <CardDescription>
            Datos principales del espacio de trabajo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceSettingsForm initialData={workspace} />
        </CardContent>
      </Card>

      <DangerZone />
    </div>
  );
}
