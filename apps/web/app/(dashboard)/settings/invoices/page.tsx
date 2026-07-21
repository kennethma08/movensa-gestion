export const dynamic = 'force-dynamic';

import { NumberSequenceForm, InvoiceDefaultsForm } from '@/components/settings';
import { getNumberSequences, getInvoiceDefaults } from '@/lib/settings/actions';

export const metadata = {
  title: 'Configuración de facturas',
};

export default async function InvoiceSettingsPage() {
  const [sequences, invoiceDefaults] = await Promise.all([
    getNumberSequences(),
    getInvoiceDefaults(),
  ]);
  const invoiceSequence = sequences.find((s) => s.type === 'invoice') || null;

  return (
    <div className="space-y-6">
      <NumberSequenceForm
        type="invoice"
        title="Numeración de facturas"
        description="Configure el formato utilizado para generar los números de factura."
        initialData={invoiceSequence}
      />

      <InvoiceDefaultsForm initialData={invoiceDefaults} />
    </div>
  );
}
