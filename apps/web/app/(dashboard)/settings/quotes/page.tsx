export const dynamic = 'force-dynamic';

import { NumberSequenceForm } from '@/components/settings';
import { getNumberSequences } from '@/lib/settings/actions';

export const metadata = {
  title: 'Configuración de cotizaciones',
};

export default async function QuoteSettingsPage() {
  const sequences = await getNumberSequences();
  const quoteSequence = sequences.find((s) => s.type === 'quote') || null;

  return (
    <NumberSequenceForm
      type="quote"
      title="Numeración de cotizaciones"
      description="Configure el formato utilizado para generar los números de cotización."
      initialData={quoteSequence}
    />
  );
}
