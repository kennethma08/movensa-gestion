'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Save,
  Download,
  Send,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ZoomIn,
  ZoomOut,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuoteBuilderStore } from '@/lib/stores/quote-builder-store';
import { createQuote, updateQuote, sendQuote } from '@/lib/quotes/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function BuilderToolbar() {
  const router = useRouter();
  const [isSendLoading, setIsSendLoading] = useState(false);

  const {
    document,
    isDirty,
    isSaving,
    previewMode,
    zoom,
    showBlocksPanel,
    showPropertiesPanel,
    historyIndex,
    history,
    toggleBlocksPanel,
    togglePropertiesPanel,
    togglePreviewMode,
    setZoom,
    undo,
    redo,
    setSaving,
    markSaved,
    updateDocumentId,
  } = useQuoteBuilderStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleSave = async (): Promise<boolean> => {
    if (!document) {
      toast.error('No hay un documento para guardar');
      return false;
    }

    setSaving(true);
    try {
      // New quote: create in database first
      if (!document.id) {
        if (!document.clientId) {
          toast.error('Seleccione un cliente antes de guardar');
          setSaving(false);
          return false;
        }

        const result = await createQuote({
          title: document.title || 'Cotización sin título',
          clientId: document.clientId,
          projectId: document.projectId,
          blocks: document.blocks,
        });

        if (result.success && result.quote) {
          updateDocumentId(result.quote.id, result.quote.quoteNumber);
          markSaved();
          toast.success('Cotización creada correctamente');
          router.replace(`/quotes/${result.quote.id}/builder`);
          return true;
        } else {
          toast.error(result.error || 'No se pudo crear la cotización');
          return false;
        }
      }

      // Existing quote: update
      const result = await updateQuote(document.id, {
        title: document.title,
        blocks: document.blocks,
        notes: document.notes,
        terms: document.terms,
        internalNotes: document.internalNotes,
      });

      if (result.success) {
        markSaved();
        toast.success('Cotización guardada correctamente');
        return true;
      } else {
        toast.error(result.error || 'No se pudo guardar la cotización');
        return false;
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('No se pudo guardar la cotización');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!document || !document.id) {
      toast.error('Guarde primero la cotización');
      return;
    }
    try {
      toast.info('Generando PDF...');
      window.open(`/api/download/quote/${document.id}`, '_blank');
    } catch {
      toast.error('No se pudo exportar el PDF');
    }
  };

  const handleSend = async () => {
    if (!document || !document.id) {
      toast.error('Guarde primero la cotización');
      return;
    }

    // Save first if there are unsaved changes
    if (isDirty) {
      const saved = await handleSave();
      if (!saved) return;
    }

    setIsSendLoading(true);
    try {
      const result = await sendQuote(document.id);

      if (result.success) {
        if (result.emailSent) {
          toast.success('Cotización enviada y correo entregado');
        } else {
          toast.warning('La cotización se marcó como enviada, pero el correo no pudo entregarse. Revise la configuración del correo.');
        }
        router.push(`/quotes/${document.id}`);
      } else {
        toast.error(result.error || 'No se pudo enviar la cotización');
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error('No se pudo enviar la cotización');
    } finally {
      setIsSendLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-b bg-card px-2 py-2 md:px-4">
      {/* Left section */}
      <div className="flex items-center gap-1 md:gap-2">
        <Button variant="ghost" size="icon" asChild aria-label="Volver a cotizaciones">
          <Link href="/quotes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="mx-1 h-6 w-px bg-border hidden md:block" />

        <Button
          variant={showBlocksPanel ? 'secondary' : 'ghost'}
          size="icon"
          onClick={toggleBlocksPanel}
          title={showBlocksPanel ? 'Ocultar panel de bloques' : 'Mostrar panel de bloques'}
          aria-label={showBlocksPanel ? 'Ocultar panel de bloques' : 'Mostrar panel de bloques'}
        >
          {showBlocksPanel ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant={showPropertiesPanel ? 'secondary' : 'ghost'}
          size="icon"
          onClick={togglePropertiesPanel}
          title={showPropertiesPanel ? 'Ocultar panel de propiedades' : 'Mostrar panel de propiedades'}
          aria-label={showPropertiesPanel ? 'Ocultar panel de propiedades' : 'Mostrar panel de propiedades'}
        >
          {showPropertiesPanel ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>

        <div className="mx-1 h-6 w-px bg-border hidden md:block" />

        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={!canUndo}
          title="Deshacer (Ctrl+Z)"
          aria-label="Deshacer"
          className="hidden sm:inline-flex"
        >
          <Undo2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={!canRedo}
          title="Rehacer (Ctrl+Shift+Z)"
          aria-label="Rehacer"
          className="hidden sm:inline-flex"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Center section - Document title */}
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="font-medium truncate text-sm md:text-base">
          {document?.title || 'Cotización sin título'}
        </h1>
        {isDirty && (
          <span className="text-xs text-muted-foreground hidden sm:inline">(sin guardar)</span>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Zoom controls - hidden on mobile */}
        <div className="hidden lg:flex items-center gap-1 rounded-md border bg-background">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            disabled={zoom <= 50}
            aria-label="Alejar"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="w-12 text-center text-sm">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            disabled={zoom >= 200}
            aria-label="Acercar"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
        </div>

        <Button
          variant={previewMode ? 'default' : 'outline'}
          size="sm"
          onClick={togglePreviewMode}
          className="hidden sm:inline-flex"
        >
          {previewMode ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Editar
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Vista previa
            </>
          )}
        </Button>

        {/* Mobile preview icon-only button */}
        <Button
          variant={previewMode ? 'default' : 'outline'}
          size="icon"
          onClick={togglePreviewMode}
          aria-label={previewMode ? 'Cambiar al modo de edición' : 'Vista previa'}
          className="sm:hidden"
        >
          {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>

        <div className="mx-1 h-6 w-px bg-border hidden md:block" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="hidden md:inline-flex"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar
        </Button>

        {/* Mobile save icon-only */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          aria-label="Guardar"
          className="md:hidden"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden md:inline-flex">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDF}>
              Exportar como PDF
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-muted-foreground">
              Exportar como imagen (próximamente)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-muted-foreground">
              Copiar enlace para compartir (próximamente)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile Export icon-only */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Exportar" className="md:hidden">
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDF}>
              Exportar como PDF
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-muted-foreground">
              Exportar como imagen (próximamente)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-muted-foreground">
              Copiar enlace para compartir (próximamente)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" onClick={handleSend} disabled={isSendLoading} className="hidden md:inline-flex">
          {isSendLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Enviar
        </Button>

        {/* Mobile Send icon-only */}
        <Button size="icon" onClick={handleSend} disabled={isSendLoading} aria-label="Enviar" className="md:hidden">
          {isSendLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
