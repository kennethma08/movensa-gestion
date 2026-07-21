import { notFound, redirect } from 'next/navigation';
import { getQuote } from '@/lib/quotes/actions';
import EditQuoteForm from './edit-quote-form';

export const metadata = {
  title: 'Editar cotización',
};

interface EditQuotePageProps {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    notFound();
  }

  const quote = await getQuote(id);

  if (!quote) {
    notFound();
  }

  // Draft and under-review quotes can still be adjusted before approval.
  if (!['draft', 'under_review'].includes(quote.status)) {
    redirect(`/quotes/${id}`);
  }

  return <EditQuoteForm quote={quote} />;
}
