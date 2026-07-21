'use client';

import { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, X, FileText } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useQuoteBuilderStore } from '@/lib/stores/quote-builder-store';
import type { QuoteBlock, BlockType } from '@/lib/quotes/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getContractTemplates } from '@/lib/contracts/actions';

export function PropertiesPanel() {
  const { document, selectedBlockId, updateBlock, togglePropertiesPanel } = useQuoteBuilderStore();
  const [contractTemplates, setContractTemplates] = useState<{ id: string; name: string }[]>([]);

  // Bug #76: Add error handling for contract template fetch
  useEffect(() => {
    getContractTemplates()
      .then((result) => {
        setContractTemplates(result.data.map((t) => ({ id: t.id, name: t.name })));
      })
      .catch((error) => {
        console.error('Failed to load contract templates:', error);
      });
  }, []);

  const selectedBlock = document?.blocks.find((b) => b.id === selectedBlockId);

  if (!selectedBlock) {
    return (
      <div className="absolute md:relative right-0 top-0 z-20 flex h-full w-72 flex-col border-l bg-card shadow-lg md:shadow-none">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="font-semibold">Propiedades</h2>
            <p className="text-xs text-muted-foreground">Configuración del documento</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={togglePropertiesPanel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <DocumentSettingsPanel contractTemplates={contractTemplates} />
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="absolute md:relative right-0 top-0 z-20 flex h-full w-72 flex-col border-l bg-card shadow-lg md:shadow-none">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="font-semibold">Propiedades</h2>
          <p className="text-xs text-muted-foreground capitalize">
            {selectedBlock.type.replace('-', ' ')} Block
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={togglePropertiesPanel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <BlockProperties block={selectedBlock} onUpdate={updateBlock} />
        </div>
      </ScrollArea>
    </div>
  );
}

// Document Settings Panel (shown when no block is selected)
// CR #26: All hooks called before conditional return (Rules of Hooks)
function DocumentSettingsPanel({ contractTemplates }: { contractTemplates: { id: string; name: string }[] }) {
  const { document, updateSettings, markDirty } = useQuoteBuilderStore();

  if (!document) return null;

  const contractTemplateId = document.contractTemplateId || '';
  const selectedTemplate = contractTemplates.find((t) => t.id === contractTemplateId);
  const handleContractChange = (value: string) => {
    useQuoteBuilderStore.setState((state) => {
      if (state.document) {
        state.document.contractTemplateId = value === 'none' ? null : value;
      }
    });
    markDirty();
  };

  return (
    <div className="space-y-6">
      {/* Contract Template */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Contrato</Label>
        </div>
        <Select value={contractTemplateId || 'none'} onValueChange={handleContractChange}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccione una plantilla de contrato..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin contrato</SelectItem>
            {contractTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTemplate && (
          <p className="text-xs text-muted-foreground">
            This contract will be attached to the quote when sent.
          </p>
        )}
      </div>

      {!selectedTemplate && (
        <p className="text-center text-xs text-muted-foreground pt-4">
          Click on a block in the canvas to edit its properties.
        </p>
      )}
    </div>
  );
}

interface BlockPropertiesProps {
  block: QuoteBlock;
  onUpdate: (blockId: string, content: Partial<QuoteBlock['content']>) => void;
}

function BlockProperties({ block, onUpdate }: BlockPropertiesProps) {
  const handleUpdate = (updates: Partial<typeof block.content>) => {
    onUpdate(block.id, updates);
  };

  switch (block.type) {
    case 'header':
      return <HeaderProperties block={block} onUpdate={handleUpdate} />;
    case 'text':
      return <TextProperties block={block} onUpdate={handleUpdate} />;
    case 'service-item':
      return <ServiceItemProperties block={block} onUpdate={handleUpdate} />;
    case 'divider':
      return <DividerProperties block={block} onUpdate={handleUpdate} />;
    case 'spacer':
      return <SpacerProperties block={block} onUpdate={handleUpdate} />;
    case 'image':
      return <ImageProperties block={block} onUpdate={handleUpdate} />;
    case 'signature':
      return <SignatureProperties block={block} onUpdate={handleUpdate} />;
    case 'table':
      return <TableProperties block={block} onUpdate={handleUpdate} />;
    case 'columns':
      return <ColumnsProperties block={block} onUpdate={handleUpdate} />;
    case 'service-group':
      return <ServiceGroupProperties block={block} onUpdate={handleUpdate} />;
    default:
      return (
        <p className="text-sm text-muted-foreground">
          No properties available for this block type.
        </p>
      );
  }
}

// Header Block Properties
function HeaderProperties({
  block,
  onUpdate,
}: {
  block: Extract<QuoteBlock, { type: 'header' }>;
  onUpdate: (updates: Partial<typeof block.content>) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Texto</Label>
        <Input
          value={block.content.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Escriba el encabezado"
        />
      </div>

      <div className="space-y-2">
        <Label>Nivel del encabezado</Label>
        <Select
          value={String(block.content.level)}
          onValueChange={(value) => onUpdate({ level: parseInt(value) as 1 | 2 | 3 })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Encabezado 1 (grande)</SelectItem>
            <SelectItem value="2">Encabezado 2 (mediano)</SelectItem>
            <SelectItem value="3">Encabezado 3 (pequeño)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AlignmentSelector
        value={block.content.alignment}
        onChange={(alignment) => onUpdate({ alignment: alignment as typeof block.content.alignment })}
        options={['left', 'center', 'right']}
      />
    </>
  );
}

// Text Block Properties
function TextProperties({
  block,
  onUpdate,
}: {
  block: Extract<QuoteBlock, { type: 'text' }>;
  onUpdate: (updates: Partial<typeof block.content>) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Contenido</Label>
        <p className="text-xs text-muted-foreground">
          Edite el texto directamente en el lienzo
        </p>
      </div>

      <AlignmentSelector
        value={block.content.alignment}
        onChange={(alignment) => onUpdate({ alignment: alignment as typeof block.content.alignment })}
        options={['left', 'center', 'right', 'justify']}
      />
    </>
  );
}

// Service Item Block Properties
function ServiceItemProperties({
  block,
  onUpdate,
}: {
  block: Extract<QuoteBlock, { type: 'service-item' }>;
  onUpdate: (updates: Partial<typeof block.content>) => void;
}) {
  const { document } = useQuoteBuilderStore();
  return (
    <>
      <div className="space-y-2">
        <Label>Nombre del servicio</Label>
        <Input
          value={block.content.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Nombre del servicio"
        />
      </div>

      <div className="space-y-2">
        <Label>Descripción</Label>
        <Input
          value={block.content.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Descripción opcional"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Cantidad</Label>
          <Input
            type="number"
            value={block.content.quantity}
            onChange={(e) => onUpdate({ quantity: Math.max(1, parseFloat(e.target.value) || 1) })}
            min={1}
            step="0.01"
          />
        </div>
        <div className="space-y-2">
          <Label>Precio</Label>
          <Input
            type="number"
            value={block.content.rate}
            onChange={(e) => onUpdate({ rate: parseFloat(e.target.value) || 0 })}
            min={0}
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Unidad</Label>
          <Select
            value={block.content.unit}
            onValueChange={(value) => onUpdate({ unit: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unit">Unidad</SelectItem>
              <SelectItem value="hour">Hora</SelectItem>
              <SelectItem value="day">Día</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mes</SelectItem>
              <SelectItem value="project">Proyecto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tasa de impuesto (%)</Label>
          <Input
            type="number"
            value={block.content.taxRate || ''}
            onChange={(e) =>
              onUpdate({ taxRate: e.target.value ? parseFloat(e.target.value) : null })
            }
            min={0}
            max={100}
            step="0.1"
            placeholder="0"
          />
        </div>
      </div>

      <div className="pt-2 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total de línea</span>
          <span className="font-semibold">
            {formatCurrency(block.content.quantity * block.content.rate, document?.settings?.currency ?? 'USD')}
          </span>
        </div>
      </div>
    </>
  );
}

// Divider Block Properties
function DividerProperties({
  block,
  onUpdate,
}: {
  block: Extract<QuoteBlock, { type: 'divider' }>;
  onUpdate: (updates: Partial<typeof block.content>) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Estilo</Label>
        <Select
          value={block.content.style}
          onValueChange={(value) =>
            onUpdate({ style: value as 'solid' | 'dashed' | 'dotted' })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Continua</SelectItem>
            <SelectItem value="dashed">Discontinua</SelectItem>
            <SelectItem value="dotted">Punteada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Grosor</Label>
        <Select
          value={String(block.content.thickness)}
          onValueChange={(value) => onUpdate({ thickness: parseInt(value) as 1 | 2 | 3 })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Fina</SelectItem>
            <SelectItem value="2">Mediana</SelectItem>
            <SelectItem value="3">Gruesa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={block.content.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-12 h-9 p-1 cursor-pointer"
          />
          <Input
            value={block.content.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            placeholder="#e5e7eb"
            className="flex-1"
          />
        </div>
      </div>
    </>
  );
}

// Spacer Block Properties
function SpacerProperties({
  block,
  onUpdate,
}: {
  block: Extract<QuoteBlock, { type: 'spacer' }>;
  onUpdate: (updates: Partial<typeof block.content>) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Altura</Label>
      <Select
        value={block.content.height}
        onValueChange={(value) =>
          onUpdate({ height: value as 'sm' | 'md' | 'lg' | 'xl' })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sm">Pequeño (16 px)</SelectItem>
          <SelectItem value="md">Mediano (32 px)</SelectItem>
          <SelectItem value="lg">Grande (64 px)</SelectItem>
          <SelectItem value="xl">Muy grande (96 px)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// Image Block Properties
function ImageProperties({
  block,
  onUpdate,
}: {
  block: Extract<QuoteBlock, { type: 'image' }>;
  onUpdate: (updates: Partial<typeof block.content>) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>URL de la imagen</Label>
        <Input
          value={block.content.src}
          onChange={(e) => onUpdate({ src: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label>Texto alternativo</Label>
        <Input
          value={block.content.alt}
          onChange={(e) => onUpdate({ alt: e.target.value })}
          placeholder="Descripción de la imagen"
        />
      </div>

      <div className="space-y-2">
        <Label>Pie de imagen</Label>
        <Input
          value={block.content.caption}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          placeholder="Pie de imagen opcional"
        />
      </div>

      <div className="space-y-2">
        <Label>Ancho</Label>
        <Select
          value={block.content.width === 'full' ? 'full' : 'custom'}
          onValueChange={(value) =>
            onUpdate({ width: value === 'full' ? 'full' : 400 })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Ancho completo</SelectItem>
            <SelectItem value="custom">Ancho personalizado</SelectItem>
          </SelectContent>
        </Select>
        {typeof block.content.width === 'number' && (
          <Input
            type="number"
            value={block.content.width}
            onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 400 })}
            min={100}
            max={800}
            className="mt-2"
          />
        )}
      </div>

      <AlignmentSelector
        value={block.content.alignment}
        onChange={(alignment) => onUpdate({ alignment: alignment as typeof block.content.alignment })}
        options={['left', 'center', 'right']}
      />
    </>
  );
}

// TODO Bug #67: Signature block preview mode can be misleading — the unsigned placeholder
// looks similar to the signed state. Consider adding a clearer visual distinction (e.g. "Preview Only" badge).

// Bug #69: Drag and drop insertion logic is fully implemented in the builder page components
// (quotes/[id]/builder/page.tsx and quotes/new/builder/page.tsx). The onDragEnd handler
// correctly calculates insertion index when dropping on existing blocks (overIndex + 1)
// and appends to the end when dropping on the canvas background.

// TODO Bug #78: Signature data is stored as base64 in the DB, which bloats storage.
// Consider moving signature images to file storage (S3/R2) and storing only the URL.

// Signature Block Properties
function SignatureProperties({
  block,
  onUpdate,
}: {
  block: Extract<QuoteBlock, { type: 'signature' }>;
  onUpdate: (updates: Partial<typeof block.content>) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Etiqueta</Label>
        <Input
          value={block.content.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Firma del cliente"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Obligatorio</Label>
        <Switch
          checked={block.content.required}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>

      {block.content.signatureData && (
        <div className="space-y-2 pt-2 border-t">
          <Label>Estado</Label>
          <p className="text-sm text-green-600">Firmado</p>
          {block.content.signerName && (
            <p className="text-sm text-muted-foreground">
              By: {block.content.signerName}
            </p>
          )}
          {block.content.signedAt && (
            <p className="text-sm text-muted-foreground">
              On: {new Date(block.content.signedAt).toLocaleDateString()}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              onUpdate({ signatureData: null, signedAt: null, signerName: null })
            }
          >
            Clear Signature
          </Button>
        </div>
      )}
    </>
  );
}

// Table Block Properties
function TableProperties({
  block,
  onUpdate,
}: {
  block: Extract<QuoteBlock, { type: 'table' }>;
  onUpdate: (updates: Partial<typeof block.content>) => void;
}) {
  const addColumn = () => {
    const newHeaders = [...block.content.headers, `Column ${block.content.headers.length + 1}`];
    const newRows = block.content.rows.map((row) => [...row, '']);
    onUpdate({ headers: newHeaders, rows: newRows });
  };

  const removeColumn = () => {
    if (block.content.headers.length <= 1) return;
    const newHeaders = block.content.headers.slice(0, -1);
    const newRows = block.content.rows.map((row) => row.slice(0, -1));
    onUpdate({ headers: newHeaders, rows: newRows });
  };

  const addRow = () => {
    const newRow = Array(block.content.headers.length).fill('');
    onUpdate({ rows: [...block.content.rows, newRow] });
  };

  const removeRow = () => {
    if (block.content.rows.length <= 1) return;
    onUpdate({ rows: block.content.rows.slice(0, -1) });
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Columnas ({block.content.headers.length})</Label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={removeColumn} disabled={block.content.headers.length <= 1}>
            Quitar
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={addColumn}>
            Agregar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Filas ({block.content.rows.length})</Label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={removeRow} disabled={block.content.rows.length <= 1}>
            Quitar
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={addRow}>
            Agregar
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label>Filas alternadas</Label>
        <Switch
          checked={block.content.striped}
          onCheckedChange={(checked) => onUpdate({ striped: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Con bordes</Label>
        <Switch
          checked={block.content.bordered}
          onCheckedChange={(checked) => onUpdate({ bordered: checked })}
        />
      </div>
    </>
  );
}

// Columns Block Properties
function ColumnsProperties({
  block,
  onUpdate,
}: {
  block: Extract<QuoteBlock, { type: 'columns' }>;
  onUpdate: (updates: Partial<typeof block.content>) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Proporción de columnas</Label>
        <Select
          value={block.content.ratio}
          onValueChange={(value) => onUpdate({ ratio: value as typeof block.content.ratio })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50-50">Iguales (50/50)</SelectItem>
            <SelectItem value="33-67">Izquierda estrecha (33/67)</SelectItem>
            <SelectItem value="67-33">Izquierda amplia (67/33)</SelectItem>
            <SelectItem value="25-75">Lateral izquierda (25/75)</SelectItem>
            <SelectItem value="75-25">Lateral derecha (75/25)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Espacio</Label>
        <Select
          value={block.content.gap}
          onValueChange={(value) => onUpdate({ gap: value as 'sm' | 'md' | 'lg' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Pequeño</SelectItem>
            <SelectItem value="md">Mediana</SelectItem>
            <SelectItem value="lg">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground pt-2">
        Edite el contenido de las columnas directamente en el lienzo.
      </p>
    </>
  );
}

// Service Group Block Properties
function ServiceGroupProperties({
  block,
  onUpdate,
}: {
  block: Extract<QuoteBlock, { type: 'service-group' }>;
  onUpdate: (updates: Partial<typeof block.content>) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Título del grupo</Label>
        <Input
          value={block.content.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Grupo de servicios"
        />
      </div>

      <div className="space-y-2">
        <Label>Descripción</Label>
        <Input
          value={block.content.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Descripción opcional"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Contraído de forma predeterminada</Label>
        <Switch
          checked={block.content.collapsed}
          onCheckedChange={(checked) => onUpdate({ collapsed: checked })}
        />
      </div>

      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          {block.content.items.length} item{block.content.items.length !== 1 ? 's' : ''} in this group.
          Agregue conceptos de servicio dentro del grupo en el lienzo.
        </p>
      </div>
    </>
  );
}

// Alignment Selector Component
type AlignmentOption = 'left' | 'center' | 'right' | 'justify';

interface AlignmentSelectorProps {
  value: AlignmentOption;
  onChange: (value: AlignmentOption) => void;
  options: readonly AlignmentOption[];
}

function AlignmentSelector({ value, onChange, options }: AlignmentSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Alineación</Label>
      <div className="flex gap-1">
        {options.map((option) => (
          <Button
            key={option}
            variant={value === option ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8"
            onClick={() => onChange(option)}
          >
            {option === 'left' && <AlignLeft className="h-4 w-4" />}
            {option === 'center' && <AlignCenter className="h-4 w-4" />}
            {option === 'right' && <AlignRight className="h-4 w-4" />}
            {option === 'justify' && <AlignJustify className="h-4 w-4" />}
          </Button>
        ))}
      </div>
    </div>
  );
}
