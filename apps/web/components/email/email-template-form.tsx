'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeHtml } from '@/lib/sanitize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Switch } from '@/components/ui/switch';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  createEmailTemplate,
  updateEmailTemplate,
} from '@/lib/email/actions';
import {
  EMAIL_TEMPLATE_TYPES,
  getTemplateTypeName,
  DEFAULT_TEMPLATES,
} from '@/lib/email/types';
import type { EmailTemplateDetail, EmailTemplateType } from '@/lib/email/types';

const emailTemplateSchema = z.object({
  type: z.enum(EMAIL_TEMPLATE_TYPES as unknown as [string, ...string[]]),
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  subject: z.string().min(1, 'El asunto es obligatorio'),
  body: z.string().min(1, 'El contenido es obligatorio'),
  isActive: z.boolean(),
  isDefault: z.boolean(),
});

type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;

interface EmailTemplateFormProps {
  template?: EmailTemplateDetail | null;
}

export function EmailTemplateForm({ template }: EmailTemplateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      type: (template?.type as EmailTemplateType) || 'quote_sent',
      name: template?.name || '',
      subject: template?.subject || '',
      body: template?.body || '',
      isActive: template?.isActive ?? true,
      isDefault: template?.isDefault ?? false,
    },
  });

  const selectedType = watch('type') as EmailTemplateType;
  const body = watch('body');
  const subject = watch('subject');

  const loadDefaultTemplate = () => {
    const defaultTemplate = DEFAULT_TEMPLATES[selectedType];
    if (defaultTemplate) {
      setValue('name', defaultTemplate.name);
      setValue('subject', defaultTemplate.subject);
      setValue('body', defaultTemplate.body);
    }
  };

  const onSubmit = (data: EmailTemplateFormData) => {
    startTransition(async () => {
      try {
        if (template) {
          await updateEmailTemplate({
            id: template.id,
            ...data,
            type: data.type as EmailTemplateType,
          });
        } else {
          await createEmailTemplate({
            ...data,
            type: data.type as EmailTemplateType,
          });
        }
        toast.success(template ? 'Plantilla actualizada' : 'Plantilla creada');
        router.push('/settings/emails');
        router.refresh();
      } catch (error) {
        console.error('Failed to save template:', error);
        toast.error('No se pudo guardar la plantilla');
      }
    });
  };

  // Sample preview data
  const previewHtml = body
    .replace(/{{businessName}}/g, 'Grupo Movensa')
    .replace(/{{clientName}}/g, 'María Rodríguez')
    .replace(/{{clientEmail}}/g, 'maria@ejemplo.com')
    .replace(/{{quoteName}}/g, 'Desarrollo de sitio web')
    .replace(/{{quoteNumber}}/g, 'QT-0001')
    .replace(/{{quoteUrl}}/g, '#')
    .replace(/{{quoteTotal}}/g, '$5,000.00')
    .replace(/{{quoteValidUntil}}/g, new Date(Date.now() + 30 * 86400000).toLocaleDateString('es-CR'))
    .replace(/{{invoiceNumber}}/g, 'INV-0001')
    .replace(/{{invoiceUrl}}/g, '#')
    .replace(/{{invoiceTotal}}/g, '$5,000.00')
    .replace(/{{invoiceDueDate}}/g, new Date(Date.now() + 14 * 86400000).toLocaleDateString('es-CR'))
    .replace(/{{amountPaid}}/g, '$5,000.00')
    .replace(/{{amountDue}}/g, '$5,000.00')
    .replace(/{{daysOverdue}}/g, '7')
    .replace(/{{contractName}}/g, 'Contrato de servicios')
    .replace(/{{contractUrl}}/g, '#')
    .replace(/{{message}}/g, 'Gracias por confiar en Grupo Movensa.')
    .replace(/{{#if\s+\w+}}([\s\S]*?){{\/if}}/g, '$1');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{template ? 'Editar plantilla' : 'Crear plantilla'}</CardTitle>
          <CardDescription>
            Personalice los correos electrónicos que se envían a sus clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de plantilla</Label>
              <Select
                value={selectedType}
                onValueChange={(value) =>
                  setValue('type', value as EmailTemplateType)
                }
                disabled={!!template}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getTemplateTypeName(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la plantilla</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ej.: Cotización enviada - personalizada"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          {!template && (
            <Button type="button" variant="outline" onClick={loadDefaultTemplate}>
              Cargar plantilla predeterminada
            </Button>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Asunto del correo electrónico</Label>
            <Input
              id="subject"
              {...register('subject')}
              placeholder="Ej.: Cotización {{quoteName}} de {{businessName}}"
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Puede utilizar variables como {'{{clientName}}'} y {'{{quoteName}}'}.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Contenido del correo electrónico</Label>
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Vista previa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Vista previa del correo</DialogTitle>
                    <DialogDescription>
                      Ejemplo con datos simulados
                    </DialogDescription>
                  </DialogHeader>
                  <div className="border rounded-lg p-4 bg-card">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Asunto:</strong> {subject
                        .replace(/{{businessName}}/g, 'Grupo Movensa')
                        .replace(/{{quoteName}}/g, 'Desarrollo de sitio web')
                        .replace(/{{quoteTotal}}/g, '$5,000.00')
                        .replace(/{{invoiceNumber}}/g, 'INV-0001')
                        .replace(/{{contractName}}/g, 'Contrato de servicios')
                        .replace(/{{daysOverdue}}/g, '7')}
                    </p>
                    <hr className="my-2" />
                    <div
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml) }}
                      className="prose prose-sm max-w-none"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <RichTextEditor
              value={body}
              onChange={(val) => setValue('body', val, { shouldValidate: true })}
              placeholder="Hola {{clientName}}, ..."
            />
            {errors.body && (
              <p className="text-sm text-destructive">{errors.body.message}</p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Variables disponibles:</p>
            <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
              <code>{'{{businessName}}'}</code>
              <code>{'{{clientName}}'}</code>
              <code>{'{{clientEmail}}'}</code>
              <code>{'{{quoteName}}'}</code>
              <code>{'{{quoteNumber}}'}</code>
              <code>{'{{quoteUrl}}'}</code>
              <code>{'{{quoteTotal}}'}</code>
              <code>{'{{quoteValidUntil}}'}</code>
              <code>{'{{invoiceNumber}}'}</code>
              <code>{'{{invoiceUrl}}'}</code>
              <code>{'{{invoiceTotal}}'}</code>
              <code>{'{{invoiceDueDate}}'}</code>
              <code>{'{{amountPaid}}'}</code>
              <code>{'{{amountDue}}'}</code>
              <code>{'{{daysOverdue}}'}</code>
              <code>{'{{contractName}}'}</code>
              <code>{'{{contractUrl}}'}</code>
              <code>{'{{message}}'}</code>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Condicional: {'{{#if message}}...{{/if}}'}
            </p>
          </div>

          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
              <Label htmlFor="isActive">Activa</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isDefault"
                checked={watch('isDefault')}
                onCheckedChange={(checked) => setValue('isDefault', checked)}
              />
              <Label htmlFor="isDefault">Predeterminada para este tipo</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/settings/emails')}
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
