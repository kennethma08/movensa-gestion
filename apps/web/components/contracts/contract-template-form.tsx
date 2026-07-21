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
import { ContractEditor } from './contract-editor';
import { VariableManager } from './variable-manager';
import {
  createContractTemplate,
  updateContractTemplate,
} from '@/lib/contracts/actions';
import type {
  ContractTemplateDetail,
  ContractVariable,
} from '@/lib/contracts/types';

const contractTemplateSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(255),
  content: z.string().min(1, 'Content is required'),
});

type ContractTemplateFormData = z.infer<typeof contractTemplateSchema>;

interface ContractTemplateFormProps {
  template?: ContractTemplateDetail | null;
}

export function ContractTemplateForm({ template }: ContractTemplateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [variables, setVariables] = useState<ContractVariable[]>(
    template?.variables || []
  );
  const [content, setContent] = useState(template?.content || '');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContractTemplateFormData>({
    resolver: zodResolver(contractTemplateSchema),
    defaultValues: {
      name: template?.name || '',
      content: template?.content || '',
    },
  });

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setValue('content', newContent, { shouldValidate: true });
  };

  const onSubmit = (data: ContractTemplateFormData) => {
    startTransition(async () => {
      try {
        if (template) {
          await updateContractTemplate({
            id: template.id,
            name: data.name,
            content,
            variables,
          });
          toast.success('Plantilla actualizada correctamente');
        } else {
          await createContractTemplate({
            name: data.name,
            content,
            isTemplate: true,
            variables,
          });
          toast.success('Plantilla creada correctamente');
        }
        router.push('/templates');
        router.refresh();
      } catch (error) {
        toast.error(template ? 'No se pudo actualizar la plantilla' : 'No se pudo crear la plantilla');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{template ? 'Editar plantilla' : 'Crear plantilla'}</CardTitle>
          <CardDescription>
            {template
              ? 'Actualice los detalles y el contenido de la plantilla de contrato.'
              : 'Cree una plantilla de contrato reutilizable para diferentes clientes.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la plantilla</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ej.: Contrato estándar de servicios"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <VariableManager variables={variables} onChange={setVariables} />

      <Card>
        <CardHeader>
          <CardTitle>Contenido del contrato</CardTitle>
          <CardDescription>
            Escriba el contenido del contrato. Use la sintaxis {'{{variableKey}}'} para insertar
            variables que se reemplazarán al crear cada contrato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContractEditor
            content={content}
            onChange={handleContentChange}
            variables={variables}
          />
          {errors.content && (
            <p className="mt-2 text-sm text-destructive">{errors.content.message}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/templates')}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {template ? 'Actualizar plantilla' : 'Crear plantilla'}
        </Button>
      </div>
    </form>
  );
}
