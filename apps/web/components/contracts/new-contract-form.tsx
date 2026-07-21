'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  FileText,
  ChevronDown,
  Pencil,
  Trash2,
  Download,
  Check,
  PenLine,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { ContractEditor } from './contract-editor';
import { createContractInstance, getContractTemplateById } from '@/lib/contracts/actions';
import type { ContractTemplateListItem, ContractVariable } from '@/lib/contracts/types';

// Types
interface ClientOption {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface QuoteOption {
  id: string;
  title: string | null;
}

type PreviewTab = 'contract' | 'email' | 'pdf';

// Main Component
interface NewContractFormProps {
  templates: ContractTemplateListItem[];
  clients: ClientOption[];
  quotes: QuoteOption[];
  preselectedTemplateId?: string;
  preselectedClientId?: string;
}

export default function NewContractForm({
  templates,
  clients,
  quotes,
  preselectedTemplateId,
  preselectedClientId,
}: NewContractFormProps) {
  const router = useRouter();
  // toast from sonner (imported at top level)
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState(preselectedTemplateId || '');
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || '');
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [contractContent, setContractContent] = useState('');

  // UI State
  const [previewTab, setPreviewTab] = useState<PreviewTab>('contract');

  // Derived state
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  // Fetch template content when template changes
  useEffect(() => {
    if (!selectedTemplateId) {
      setContractContent('');
      return;
    }
    getContractTemplateById(selectedTemplateId).then((detail) => {
      if (detail) {
        setContractContent(detail.content);
        // Initialize variable defaults
        const defaults: Record<string, string> = {};
        detail.variables.forEach((v) => {
          if (v.defaultValue) defaults[v.key] = v.defaultValue;
        });
        setVariableValues(defaults);
      }
    });
  }, [selectedTemplateId]);

  // Replace variable placeholders in content for preview
  const previewContent = useMemo(() => {
    let content = contractContent;
    if (selectedTemplate) {
      for (const v of selectedTemplate.variables) {
        const value = variableValues[v.key] || `[${v.label}]`;
        content = content.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), value);
      }
    }
    return content;
  }, [contractContent, selectedTemplate, variableValues]);

  const businessName = 'Su empresa';

  // Handlers
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!selectedTemplateId || !selectedClientId) {
      toast.error('Seleccione una plantilla y una persona firmante.');
      return;
    }

    // Validate required variables
    if (selectedTemplate) {
      const missing = selectedTemplate.variables
        .filter((v) => v.required && !variableValues[v.key]?.trim())
        .map((v) => v.label);
      if (missing.length > 0) {
        toast.error(`Complete los campos obligatorios: ${missing.join(', ')}`);
        return;
      }
    }

    setLoading(true);
    try {
      // Bug #186: Pass sendImmediately flag based on isDraft
      const instance = await createContractInstance({
        contractId: selectedTemplateId,
        clientId: selectedClientId,
        quoteId: selectedQuoteId || undefined,
        variableValues,
        sendImmediately: !isDraft,
      });
      toast.success(
        isDraft
          ? 'Contrato guardado como borrador.'
          : `Contrato enviado a ${selectedClient?.name || 'la persona cliente'}.`
      );
      router.push(`/contracts/${instance.id}`);
    } catch {
      toast.error('No se pudo crear el contrato.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="grid lg:grid-cols-[1fr,420px] xl:grid-cols-[1fr,480px] h-full">
          {/* LEFT PANEL -- Editor */}
          <div className="overflow-y-auto border-r bg-background">
            <div className="max-w-[640px] mx-auto py-10 px-8 space-y-0">
              {/* Contract Details Section */}
              <div className="pb-8">
                <h3 className="text-xl font-semibold tracking-tight font-display mb-6">
                  Detalles del contrato
                </h3>

                {/* Template Selector */}
                <div className="mb-5 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Plantilla de contrato</Label>
                  <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Seleccione una plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{template.name}</span>
                            <span className="text-muted-foreground text-xs">
                              ({template.instanceCount} usos)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Client / Signee Selector */}
                <div className="mb-5">
                  {selectedClient ? (
                    <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {selectedClient.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{selectedClient.name}</p>
                          {selectedClient.email && <p className="text-xs text-muted-foreground">{selectedClient.email}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => setSelectedClientId('')}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => setSelectedClientId('')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Persona firmante</Label>
                      <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleccione una persona firmante" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              <div className="flex items-center gap-2">
                                <span>{client.name}</span>
                                {client.company && (
                                  <span className="text-muted-foreground text-xs">
                                    {client.company}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Related Quote (Optional) */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cotización relacionada (opcional)</Label>
                  <Select
                    value={selectedQuoteId || 'none'}
                    onValueChange={(v) => setSelectedQuoteId(v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Sin cotización vinculada" />
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
              </div>

              <Separator className="bg-border/60" />

              {/* Variables Section */}
              {selectedTemplate && selectedTemplate.variables.length > 0 && (
                <div className="py-8">
                  <h3 className="text-xl font-semibold tracking-tight font-display mb-2">
                    Variables del contrato
                  </h3>
                  <p className="text-[13px] text-muted-foreground mb-5">
                    Complete los valores que se insertarán en el contrato.
                  </p>

                  <div className="space-y-4">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable.key} className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          {variable.label}
                          {variable.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        {variable.type === 'boolean' ? (
                          <Select
                            value={variableValues[variable.key] || variable.defaultValue || 'false'}
                            onValueChange={(value) =>
                              setVariableValues((prev) => ({ ...prev, [variable.key]: value }))
                            }
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Sí</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={
                              variable.type === 'date'
                                ? 'date'
                                : variable.type === 'number'
                                  ? 'number'
                                  : 'text'
                            }
                            value={variableValues[variable.key] || ''}
                            onChange={(e) =>
                              setVariableValues((prev) => ({
                                ...prev,
                                [variable.key]: e.target.value,
                              }))
                            }
                            className="h-10"
                            placeholder={
                              variable.defaultValue || `Ingrese ${variable.label.toLowerCase()}`
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-border/60 mt-8" />
                </div>
              )}

              {/* Contract Content Editor */}
              {selectedTemplateId && contractContent && (
                <div className="py-8">
                  <h3 className="text-xl font-semibold tracking-tight font-display mb-2">
                    Contenido del contrato
                  </h3>
                  <p className="text-[13px] text-muted-foreground mb-5">
                    Edite el contenido o conserve el texto de la plantilla.
                  </p>
                  <ContractEditor
                    key={selectedTemplateId}
                    content={contractContent}
                    onChange={setContractContent}
                    variables={selectedTemplate?.variables}
                  />
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="flex items-center gap-3 pt-4 pb-8 border-t">
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={loading || !selectedTemplateId || !selectedClientId}
                  size="lg"
                  className="px-8"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-2 h-4 w-4" />
                  Enviar contrato
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                >
                  Guardar borrador
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL -- Live Preview */}
          <div className="overflow-y-auto bg-muted/30 flex flex-col">
            {/* Preview Tabs */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 pt-4 pb-3">
              <Tabs
                value={previewTab}
                onValueChange={(v) => setPreviewTab(v as PreviewTab)}
              >
                <TabsList className="w-full grid grid-cols-3 h-10">
                  <TabsTrigger
                    value="contract"
                    className="text-xs data-[state=active]:text-foreground"
                  >
                    Página del contrato
                  </TabsTrigger>
                  <TabsTrigger
                    value="email"
                    className="text-xs data-[state=active]:text-foreground"
                  >
                    Vista del correo
                  </TabsTrigger>
                  <TabsTrigger
                    value="pdf"
                    className="text-xs data-[state=active]:text-foreground"
                  >
                    PDF del contrato
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* CONTRACT PAGE TAB */}
            {previewTab === 'contract' && (
              <div className="p-4 flex-1">
                <div className="bg-card border shadow-sm overflow-hidden rounded-2xl relative">
                  {/* Header */}
                  <div className="px-6 pt-8 pb-5 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold tracking-tight">{businessName}</h3>
                    <p className="text-lg font-bold tracking-tight mt-1 text-primary">
                      {selectedTemplate?.name || 'Seleccione una plantilla'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedClient
                        ? `Preparado para ${selectedClient.name}`
                        : 'Seleccione una persona firmante'}
                      {' \u00B7 '}
                      {format(new Date(), 'MMM dd, yyyy')}
                    </p>
                  </div>

                  <Separator />

                  {/* Contract Body Preview */}
                  <div className="px-6 py-5">
                    {previewContent ? (
                      <div
                        className="prose prose-sm max-w-none text-sm [&_strong]:text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 max-h-[400px] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewContent) }}
                      />
                    ) : (
                      <div className="py-12 text-center">
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Seleccione una plantilla para ver la vista previa
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Signature Area */}
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-3 mb-4">
                      <PenLine className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Firma</span>
                    </div>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/10">
                      <p className="text-sm text-muted-foreground">
                        {selectedClient?.name || 'La persona firmante'} firmará aquí
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Dibuje o escriba la firma
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="px-6 pb-6 pt-2">
                    <button className="w-full h-12 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground">
                      <PenLine className="h-4 w-4" />
                      Firmar contrato
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="px-6 pb-5">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="h-px flex-1 bg-border/40" />
                      <p className="text-[10px] text-muted-foreground/50 whitespace-nowrap">
                        Gestionado por Oreko
                      </p>
                      <div className="h-px flex-1 bg-border/40" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EMAIL PREVIEW TAB */}
            {previewTab === 'email' && (
              <div className="p-4 flex-1">
                <div className="bg-card border shadow-sm overflow-hidden rounded-2xl relative">
                  {/* Email Header */}
                  <div className="px-6 pb-4 pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold tracking-tight">{businessName}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{businessName}</p>
                        <p className="font-bold text-lg mt-0.5 text-primary">Contrato</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="px-6 pb-4 flex gap-3">
                    <button className="flex-1 h-11 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground">
                      Ver y firmar contrato
                    </button>
                    <button className="flex-1 h-11 rounded-lg font-medium text-sm flex items-center justify-center gap-2 border border-border hover:bg-muted transition-colors">
                      Descargar PDF
                    </button>
                  </div>

                  <Separator />

                  {/* Contract Summary */}
                  <div className="px-6 py-4 space-y-3">
                    <p className="text-sm font-medium">
                      {selectedTemplate?.name || 'Contrato'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Hola {selectedClient?.name || '[Nombre del cliente]'},
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Revise y firme el contrato adjunto. Use el botón anterior para consultar
                      el documento completo y agregar su firma.
                    </p>
                    {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Detalles principales
                          </p>
                          <div className="space-y-1.5">
                            {selectedTemplate.variables.slice(0, 4).map((v) => (
                              <div key={v.key} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{v.label}</span>
                                <span className="font-medium">
                                  {variableValues[v.key] || '\u2014'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <Separator />

                  {/* Legal Footer */}
                  <div className="px-6 py-4 bg-muted/30 border-t">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Este correo y sus adjuntos están dirigidos exclusivamente a su destinatario.
                      Si lo recibió por error, notifíquelo de inmediato a {businessName}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CONTRACT PDF TAB */}
            {previewTab === 'pdf' && (
              <div className="p-4 flex-1 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-3 w-full">
                  Vista previa A4 · {selectedTemplate?.name || 'Ninguna plantilla seleccionada'}
                </p>

                <div className="w-full overflow-hidden flex-1 flex items-start justify-center">
                  <div
                    style={{
                      width: '595px',
                      height: '842px',
                      transform: 'scale(var(--pdf-scale, 0.68))',
                      transformOrigin: 'top center',
                    }}
                    className="bg-white shadow-2xl rounded-sm border border-border/40 flex-shrink-0 relative"
                  >
                    <div
                      className="w-full h-full flex flex-col text-black overflow-hidden"
                      style={{ fontFamily: 'system-ui, sans-serif' }}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between px-10 pt-8 pb-6">
                        <div>
                          <h2 className="text-xl font-bold" style={{ color: '#111' }}>
                            {businessName}
                          </h2>
                          <p className="text-xs mt-1" style={{ color: '#666' }}>
                            hello@company.com
                          </p>
                        </div>
                        <div className="text-right">
                          <h1
                            className="text-2xl font-bold tracking-tight"
                            style={{ color: '#3786b3' }}
                          >
                            CONTRATO
                          </h1>
                          <p className="text-xs mt-1" style={{ color: '#666' }}>
                            {format(new Date(), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>

                      {/* Prepared For */}
                      <div className="px-10 pb-4">
                        <p
                          className="text-[10px] uppercase tracking-wider font-semibold mb-1"
                          style={{ color: '#999' }}
                        >
                          Preparado para
                        </p>
                        <p className="text-sm font-medium" style={{ color: '#111' }}>
                          {selectedClient?.name || 'Nombre del cliente'}
                        </p>
                        {selectedClient?.company && (
                          <p className="text-xs" style={{ color: '#666' }}>
                            {selectedClient.company}
                          </p>
                        )}
                      </div>

                      {/* Contract Title */}
                      <div className="px-10 pb-4">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: '#3786b3' }}
                        >
                          {selectedTemplate?.name || 'Contrato'}
                        </p>
                      </div>

                      {/* Content Preview */}
                      <div className="px-10 flex-1 overflow-hidden">
                        {previewContent ? (
                          <div
                            className="text-[10px] leading-relaxed max-h-[500px] overflow-hidden"
                            style={{ color: '#333' }}
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewContent) }}
                          />
                        ) : (
                          <p
                            className="text-xs py-8 text-center"
                            style={{ color: '#999' }}
                          >
                            Seleccione una plantilla para ver la vista previa
                          </p>
                        )}
                      </div>

                      {/* Signature Line */}
                      <div className="px-10 pb-8 pt-4">
                        <div className="flex gap-16">
                          <div className="flex-1">
                            <div
                              className="border-t pt-2"
                              style={{ borderColor: '#ddd' }}
                            >
                              <p
                                className="text-[10px] font-medium"
                                style={{ color: '#333' }}
                              >
                                {selectedClient?.name || 'Cliente'}
                              </p>
                              <p className="text-[9px]" style={{ color: '#999' }}>
                                Firma / Fecha
                              </p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div
                              className="border-t pt-2"
                              style={{ borderColor: '#ddd' }}
                            >
                              <p
                                className="text-[10px] font-medium"
                                style={{ color: '#333' }}
                              >
                                {businessName}
                              </p>
                              <p className="text-[9px]" style={{ color: '#999' }}>
                                Firma / Fecha
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
