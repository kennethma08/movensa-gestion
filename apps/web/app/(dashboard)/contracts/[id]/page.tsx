import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Hourglass,
  Eye,
  Mail,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ContractEditor } from '@/components/contracts/contract-editor';
import { ContractDetailActions } from '@/components/contracts/contract-detail-actions';
import { getContractInstanceById } from '@/lib/contracts/actions';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return { title: 'Contrato no encontrado' };
  }
  try {
    const instance = await getContractInstanceById(id);
    return {
      title: instance?.contractName || 'Contrato',
      description: 'Ver detalles del contrato',
    };
  } catch {
    return { title: 'Contrato no encontrado' };
  }
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }
> = {
  draft: {
    label: 'Borrador',
    variant: 'secondary',
    icon: <FileText className="h-4 w-4" />,
  },
  sent: {
    label: 'Enviado',
    variant: 'default',
    icon: <Mail className="h-4 w-4" />,
  },
  viewed: {
    label: 'Visto',
    variant: 'outline',
    icon: <Eye className="h-4 w-4" />,
  },
  pending: {
    label: 'Pending Countersign',
    variant: 'outline',
    icon: <Hourglass className="h-4 w-4" />,
  },
  signed: {
    label: 'Signed',
    variant: 'default',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  expired: {
    label: 'Vencido',
    variant: 'destructive',
    icon: <Clock className="h-4 w-4" />,
  },
};

export default async function ContractDetailPage({ params }: PageProps) {
  const { id } = await params;
  const instance = await getContractInstanceById(id);

  if (!instance) {
    notFound();
  }

  const config = statusConfig[instance.status] ?? statusConfig.draft;

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/contracts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a contratos
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{instance.contractName}</h1>
              <Badge variant={config?.variant ?? 'secondary'} className="gap-1">
                {config?.icon}
                {config?.label ?? instance.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              For {instance.clientName} · Created {formatDate(instance.createdAt)}
            </p>
          </div>
          <ContractDetailActions
            contractId={instance.id}
            contractName={instance.contractName}
            status={instance.status}
            clientViewUrl={`/c/${instance.accessToken}`}
            pdfUrl={instance.pdfUrl}
          />
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del contrato</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{instance.clientName}</p>
            </div>
            {instance.quoteName && (
              <div>
                <p className="text-sm text-muted-foreground">Cotización relacionada</p>
                <p className="font-medium">{instance.quoteName}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Enviado</p>
              <p className="font-medium">
                {instance.sentAt ? formatDate(instance.sentAt) : 'No enviado'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Visto</p>
              <p className="font-medium">
                {instance.viewedAt ? formatDate(instance.viewedAt) : 'No visto'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Firmado</p>
              <p className="font-medium">
                {instance.signedAt ? formatDate(instance.signedAt) : 'No firmado'}
              </p>
            </div>
            {instance.signerIpAddress && (
              <div>
                <p className="text-sm text-muted-foreground">IP del cliente</p>
                <p className="font-medium font-mono text-sm">
                  {instance.signerIpAddress}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {(instance.signatureData || instance.status === 'pending' || instance.status === 'signed') && (
          <Card>
            <CardHeader>
              <CardTitle>Firmas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Client Signature */}
                <div>
                  <p className="text-sm font-medium mb-2">Firma del cliente</p>
                  {instance.signatureData ? (
                    <div className="border rounded-lg p-4 bg-card">
                      {instance.signatureData.type === 'drawn' && (instance.signatureData.value.startsWith('data:image/') || instance.signatureData.value.startsWith('https://')) ? (
                        <img
                          src={instance.signatureData.value}
                          alt="Firma del cliente"
                          className="max-h-24"
                        />
                      ) : instance.signatureData.type === 'drawn' ? (
                        <p className="text-sm text-muted-foreground">Los datos de la firma no son válidos</p>
                      ) : (
                        <p
                          className="text-3xl"
                          style={{ fontFamily: "'Brush Script MT', cursive" }}
                        >
                          {instance.signatureData.value}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Firmado por {instance.signatureData.name} el{' '}
                        {formatDate(new Date(instance.signatureData.date))}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-4 h-24 flex items-center justify-center text-sm text-muted-foreground">
                      Firma del cliente pendiente
                    </div>
                  )}
                </div>

                {/* Business Signature */}
                <div>
                  <p className="text-sm font-medium mb-2">Firma de la empresa</p>
                  {instance.countersignatureData ? (
                    <div className="border rounded-lg p-4 bg-card">
                      {instance.countersignatureData.type === 'drawn' && (instance.countersignatureData.value.startsWith('data:image/') || instance.countersignatureData.value.startsWith('https://')) ? (
                        <img
                          src={instance.countersignatureData.value}
                          alt="Business Signature"
                          className="max-h-24"
                        />
                      ) : instance.countersignatureData.type === 'drawn' ? (
                        <p className="text-sm text-muted-foreground">Los datos de la firma no son válidos</p>
                      ) : (
                        <p
                          className="text-3xl"
                          style={{ fontFamily: "'Brush Script MT', cursive" }}
                        >
                          {instance.countersignatureData.value}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Contrafirmado por {instance.countersignatureData.name} el{' '}
                        {formatDate(new Date(instance.countersignatureData.date))}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-4 h-24 flex items-center justify-center text-sm text-muted-foreground">
                      Contrafirma de la empresa pendiente
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Contenido del contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <ContractEditor
              content={instance.content}
              editable={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
