'use client';

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  under_review: {
    bg: 'bg-amber-100 dark:bg-amber-900',
    text: 'text-amber-700 dark:text-amber-300',
  },
  sent: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300' },
  viewed: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-700 dark:text-yellow-300' },
  accepted: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300' },
  declined: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300' },
  expired: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-700 dark:text-orange-300' },
  converted: {
    bg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-700 dark:text-purple-300',
  },
};

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  under_review: 'En estudio',
  sent: 'Enviada',
  viewed: 'Vista',
  accepted: 'Aceptada',
  declined: 'Denegada',
  expired: 'Vencida',
  converted: 'Convertida',
};

export function QuoteStatusBadge({ status }: { status: string }) {
  const defaultStyle = {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-700 dark:text-blue-300',
  };
  const style = statusColors[status] ?? defaultStyle;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
