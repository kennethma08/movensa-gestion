import { ContractTemplateForm } from '@/components/contracts/contract-template-form';

export const metadata = {
  title: 'Nueva plantilla de contrato',
  description: 'Crear una nueva plantilla de contrato',
};

export default function NewTemplatePage() {
  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nueva plantilla de contrato</h1>
        <p className="text-muted-foreground">
          Cree una plantilla de contrato reutilizable para sus clientes.
        </p>
      </div>

      <ContractTemplateForm />
    </div>
  );
}
