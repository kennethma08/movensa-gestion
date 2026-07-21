'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContractEditor } from './contract-editor';
import { createContractInstance } from '@/lib/contracts/actions';
import type { ContractTemplateListItem, ContractVariable } from '@/lib/contracts/types';

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

interface QuoteOption {
  id: string;
  title: string | null;
}

interface CreateContractFormProps {
  templates: ContractTemplateListItem[];
  clients: ClientOption[];
  quotes: QuoteOption[];
  preselectedTemplateId?: string;
  preselectedClientId?: string;
  preselectedQuoteId?: string;
}

const createContractSchema = z.object({
  contractId: z.string().min(1, 'Seleccione una plantilla'),
  clientId: z.string().min(1, 'Seleccione un cliente'),
  quoteId: z.string().optional(),
});

type CreateContractFormData = z.infer<typeof createContractSchema>;

export function CreateContractForm({
  templates,
  clients,
  quotes,
  preselectedTemplateId,
  preselectedClientId,
  preselectedQuoteId,
}: CreateContractFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplateListItem | null>(
    templates.find((t) => t.id === preselectedTemplateId) || null
  );
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateContractFormData>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      contractId: preselectedTemplateId || '',
      clientId: preselectedClientId || '',
      quoteId: preselectedQuoteId || '',
    },
  });

  const selectedContractId = watch('contractId');
  const selectedClientId = watch('clientId');

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplate(template || null);
    setValue('contractId', templateId);

    // Reset variable values
    if (template) {
      const defaults: Record<string, string> = {};
      template.variables.forEach((v) => {
        if (v.defaultValue) {
          defaults[v.key] = v.defaultValue;
        }
      });
      setVariableValues(defaults);
    }
  };

  const onSubmit = (data: CreateContractFormData) => {
    // Validate required variables
    if (selectedTemplate) {
      const missingRequired = selectedTemplate.variables
        .filter((v) => v.required && !variableValues[v.key]?.trim())
        .map((v) => v.label);
      if (missingRequired.length > 0) {
        toast.error(`Complete los campos obligatorios: ${missingRequired.join(', ')}`);
        return;
      }
    }

    startTransition(async () => {
      try {
        const instance = await createContractInstance({
          contractId: data.contractId,
          clientId: data.clientId,
          quoteId: data.quoteId || undefined,
          variableValues,
        });
        router.push(`/contracts/${instance.id}`);
        router.refresh();
      } catch (error) {
        toast.error('No se pudo crear el contrato. Inténtelo nuevamente.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear contrato</CardTitle>
          <CardDescription>
            Cree un contrato para su cliente a partir de una plantilla.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Plantilla de contrato</Label>
            <Select
              value={selectedContractId}
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Seleccione una plantilla" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contractId && (
              <p className="text-sm text-destructive">{errors.contractId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select
              value={selectedClientId}
              onValueChange={(value) => setValue('clientId', value)}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Seleccione un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company || client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && (
              <p className="text-sm text-destructive">{errors.clientId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote">Cotización relacionada (opcional)</Label>
            <Select
              value={watch('quoteId') || 'none'}
              onValueChange={(value) =>
                setValue('quoteId', value === 'none' ? '' : value)
              }
            >
              <SelectTrigger id="quote">
                <SelectValue placeholder="Seleccione una cotización (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin cotización vinculada</SelectItem>
                {quotes.map((quote) => (
                  <SelectItem key={quote.id} value={quote.id}>
                    {quote.title || 'Cotización sin título'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedTemplate && selectedTemplate.variables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Valores de las variables</CardTitle>
            <CardDescription>
              Personalice los valores de las variables del contrato.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTemplate.variables.map((variable) => (
              <div key={variable.key} className="space-y-2">
                <Label htmlFor={variable.key}>
                  {variable.label}
                  {variable.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                {variable.type === 'boolean' ? (
                  <Select
                    value={variableValues[variable.key] || variable.defaultValue || 'false'}
                    onValueChange={(value) =>
                      setVariableValues((prev) => ({
                        ...prev,
                        [variable.key]: value,
                      }))
                    }
                  >
                    <SelectTrigger id={variable.key}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sí</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={variable.key}
                    type={variable.type === 'date' ? 'date' : variable.type === 'number' ? 'number' : 'text'}
                    value={variableValues[variable.key] || ''}
                    onChange={(e) =>
                      setVariableValues((prev) => ({
                        ...prev,
                        [variable.key]: e.target.value,
                      }))
                    }
                    placeholder={variable.defaultValue || `Ingrese ${variable.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/contracts')}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending || !selectedContractId || !selectedClientId}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear contrato
        </Button>
      </div>
    </form>
  );
}
