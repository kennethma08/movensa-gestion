import { type ReactNode } from 'react';
import { TemplateTabs } from './template-tabs';

// Low #75: Server component layout — child pages can export static metadata
export default function TemplatesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plantillas</h1>
        <p className="text-muted-foreground">
          Administre las plantillas de contratos, facturas y correos electrónicos.
        </p>
      </div>
      <TemplateTabs />
      <div>{children}</div>
    </div>
  );
}
