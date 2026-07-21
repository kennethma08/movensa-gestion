import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ContractsDataTable } from '@/components/contracts';
import { getContractInstances } from '@/lib/contracts/actions';

export const metadata = {
  title: 'Contratos',
  description: 'Gestión de contratos y firmas',
};

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

async function ContractListContent({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; page?: string };
}) {
  const { data: instances } = await getContractInstances({
    search: searchParams.search,
    status: searchParams.status,
    page: searchParams.page ? parseInt(searchParams.page, 10) : 1,
  });

  return <ContractsDataTable data={instances} />;
}

function ContractListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default async function ContractsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground">
            Administre documentos, versiones y estado de las firmas
          </p>
        </div>
        <Button asChild>
          <Link href="/contracts/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo contrato
          </Link>
        </Button>
      </div>

      <Suspense fallback={<ContractListSkeleton />}>
        <ContractListContent searchParams={params} />
      </Suspense>
    </div>
  );
}
