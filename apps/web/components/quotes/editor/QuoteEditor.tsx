'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Save,
  Send,
  FileText,
  Mail,
  CreditCard,
  Blocks,
  Upload,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { DetailsSection } from './sections/DetailsSection';
import { ItemsSection } from './sections/ItemsSection';
import { TermsSection } from './sections/TermsSection';
import { NotesSection } from './sections/NotesSection';

import { useQuoteForm } from './hooks/useQuoteForm';
import { useQuoteSave } from './hooks/useQuoteSave';
import { useLogoUpload } from './hooks/useLogoUpload';
import { useQuoteTotals } from './hooks/useQuoteTotals';

type PreviewMode = 'payment' | 'email' | 'pdf';
type EditorSection = 'details' | 'items' | 'terms' | 'notes';

const sectionNav = [
  { id: 'details' as const, label: 'Detalles' },
  { id: 'items' as const, label: 'Conceptos' },
  { id: 'terms' as const, label: 'Términos' },
  { id: 'notes' as const, label: 'Notas' },
];

export function QuoteEditor() {
  const router = useRouter();
  const [previewMode, setPreviewMode] = useState<PreviewMode>('payment');
  const [activeSection, setActiveSection] = useState<EditorSection>('details');

  const {
    document,
    isDirty,
    isSaving,
    client,
    title,
    projectId,
    expirationDays,
    taxRate,
    setExpirationDays,
    setTaxRate,
    handleTitleChange,
    handleProjectChange,
    handleClientChange,
    updateNotes,
    updateTerms,
    updateInternalNotes,
    addBlock,
    updateBlock,
    removeBlock,
  } = useQuoteForm();

  const {
    isLoading,
    isSending,
    showSendConfirm,
    setShowSendConfirm,
    handleSave,
    handleSendQuote,
  } = useQuoteSave({ document, client });

  const { logoUrl, isUploadingLogo, handleLogoUpload } = useLogoUpload();
  const { serviceItems, subtotal, taxAmount, total } = useQuoteTotals(document?.blocks, taxRate);
  const editorCurrency = document?.currency || document?.settings.currency || 'USD';

  const handleSwitchToBuilder = () => {
    if (client?.id) {
      router.push(`/quotes/new/builder?clientId=${client.id}`);
    } else {
      router.push('/quotes/new/builder');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/quotes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {title || 'Nueva cotización'}
              {isDirty && (
                <span className="text-muted-foreground ml-2">(sin guardar)</span>
              )}
            </h1>
            {client && (
              <p className="text-muted-foreground text-sm">
                Para {client.company || client.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSwitchToBuilder} size="sm">
            <Blocks className="mr-2 h-4 w-4" />
            Editor visual
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isLoading || isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Guardando...' : 'Guardar sin enviar'}
          </Button>
          <Button
            onClick={() => setShowSendConfirm(true)}
            disabled={isLoading || !client}
          >
            <Send className="mr-2 h-4 w-4" />
            Enviar cotización
          </Button>
        </div>
      </div>

      {/* Main Content - Split View (~60/40) */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left - Form (~60% = 3 columns) */}
        <div className="space-y-6 lg:col-span-3">
          {/* Section Navigation */}
          <div className="flex gap-2 border-b pb-2">
            {sectionNav.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </Button>
            ))}
          </div>

          {/* Active Section */}
          {activeSection === 'details' && (
            <DetailsSection
              title={title}
              onTitleChange={handleTitleChange}
              expirationDays={expirationDays}
              onExpirationChange={setExpirationDays}
              taxRate={taxRate}
              onTaxRateChange={setTaxRate}
              client={client}
              onClientChange={handleClientChange}
              projectId={projectId}
              onProjectChange={handleProjectChange}
            />
          )}

          {activeSection === 'items' && (
            <ItemsSection
              blocks={document?.blocks || []}
              onAddBlock={addBlock}
              onUpdateBlock={updateBlock}
              onRemoveBlock={removeBlock}
              currency={editorCurrency}
            />
          )}

          {activeSection === 'terms' && (
            <TermsSection
              terms={document?.terms || ''}
              onTermsChange={(terms) => updateTerms(terms)}
            />
          )}

          {activeSection === 'notes' && (
            <NotesSection
              notes={document?.notes || ''}
              onNotesChange={(notes) => updateNotes(notes)}
              internalNotes={document?.internalNotes || ''}
              onInternalNotesChange={(notes) => updateInternalNotes(notes)}
            />
          )}
        </div>

        {/* Right - Preview (~40% = 2 columns) */}
        <div className="space-y-4 lg:col-span-2">
          {/* Preview Mode Tabs */}
          <Tabs
            value={previewMode}
            onValueChange={(v) => setPreviewMode(v as PreviewMode)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Pago</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Correo</span>
              </TabsTrigger>
              <TabsTrigger value="pdf" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Preview Card */}
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <div className="rounded-lg border bg-card p-6 shadow-sm min-h-[500px]">
                {/* Logo Upload Area */}
                <div className="mb-4">
                  <label
                    htmlFor="logo-upload"
                    className={cn(
                      'flex items-center justify-center w-full h-16 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                      logoUrl
                        ? 'border-transparent'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    {isUploadingLogo ? (
                      <div role="status" aria-label="Subiendo logo">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : logoUrl ? (
                      <div className="relative h-12 w-32">
                        <Image
                          src={logoUrl}
                          alt="Logo del negocio"
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4" />
                        <span>Subir logo (PNG/JPG, máx. 2 MB)</span>
                      </div>
                    )}
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleLogoUpload}
                      className="hidden"
                      aria-label="Subir logo del negocio"
                    />
                  </label>
                </div>

                {/* Quote Header */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold">{title || 'Cotización'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {document?.quoteNumber || 'BORRADOR'}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {formatCurrency(total, editorCurrency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Válida por {expirationDays} días
                  </p>
                </div>

                <Separator className="my-4" />

                {/* Client Info */}
                {client && (
                  <div className="mb-6">
                    <p className="font-medium">
                      {client.company || client.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {client.email}
                    </p>
                  </div>
                )}

                {/* Line Items Summary */}
                <div className="space-y-2 mb-6">
                  {serviceItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.content.name || 'Sin título'} ×{' '}
                        {item.content.quantity}
                      </span>
                      <span>
                        {formatCurrency(
                          item.content.quantity * item.content.rate
                        )}
                      </span>
                    </div>
                  ))}

                  {serviceItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aún no hay conceptos
                    </p>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, editorCurrency)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Impuesto ({taxRate}%)</span>
                      <span>{formatCurrency(taxAmount, editorCurrency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(total, editorCurrency)}</span>
                  </div>
                </div>

                {previewMode === 'payment' && (
                  <div className="mt-6 space-y-2">
                    <Button className="w-full" disabled>
                      Aceptar y pagar depósito
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Solo vista previa: el cliente verá este botón en el portal
                    </p>
                  </div>
                )}

                {previewMode === 'email' && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm">
                    <p className="font-medium mb-2">Vista previa del correo</p>
                    <p className="text-muted-foreground">
                      Hola {client?.name || 'cliente'},
                    </p>
                    <p className="text-muted-foreground mt-2">
                      Adjuntamos su cotización de &quot;{title || 'Nueva cotización'}&quot;
                      por un total de {formatCurrency(total, editorCurrency)}.
                    </p>
                    <p className="text-muted-foreground mt-2">
                      Esta cotización es válida por {expirationDays} días.
                    </p>
                  </div>
                )}

                {previewMode === 'pdf' && (
                  <div className="mt-6 text-center space-y-2">
                    <Button variant="outline" disabled>
                      <FileText className="mr-2 h-4 w-4" />
                      Descargar vista previa en PDF
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      El PDF estará disponible después de guardar la cotización
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Enviar cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              La cotización se enviará a {client?.email || 'la persona cliente'}.
              Su estado cambiará a &quot;Enviada&quot; y recibirá un correo con el enlace
              para verla y aceptarla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendQuote} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar cotización
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
