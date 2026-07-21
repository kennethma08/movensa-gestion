'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { formatCurrency } from '@/lib/utils';
import type { QuoteBlock, ServiceItemBlock } from '@/lib/quotes/types';
import { createBlock } from '@/lib/quotes/types';

// ─── Saved Line Items (from templates/invoice-items) ─────
const savedLineItems = [
  { id: '1', name: 'Gestión de proyecto', description: 'Planificación y coordinación de entregables', price: 0 },
  { id: '2', name: 'Diseño y desarrollo web', description: 'Diseño y desarrollo completo de un sitio web', price: 150 },
  { id: '3', name: 'Asistencia virtual', description: 'Tareas administrativas y de soporte remoto', price: 0 },
  { id: '4', name: 'Gastos de traslado', description: 'Costos de viaje y transporte', price: 300 },
  { id: '5', name: 'Alquiler de espacio', description: 'Alquiler por hora de oficina o estudio', price: 100 },
  { id: '6', name: 'Tiempo de estudio', description: 'Sesión profesional en estudio', price: 400 },
  { id: '7', name: 'Desarrollo de software', description: 'Desarrollo de software y aplicaciones a la medida', price: 0 },
  { id: '8', name: 'Gestión de redes sociales', description: 'Estrategia y gestión de contenido para redes sociales', price: 75 },
  { id: '9', name: 'Optimización para buscadores (SEO)', description: 'Auditoría, palabras clave y optimización SEO', price: 0 },
  { id: '10', name: 'Sesión de consultoría', description: 'Sesión individual de consultoría o acompañamiento', price: 50 },
  { id: '11', name: 'Tiempo de producción', description: 'Producción de video, audio o contenido', price: 1000 },
  { id: '12', name: 'Cargo de gestión', description: 'Procesamiento y gestión administrativa', price: 15 },
  { id: '13', name: 'Estrategia de marca', description: 'Posicionamiento, mensajes e identidad de marca', price: 250 },
  { id: '14', name: 'Fotografía', description: 'Servicios profesionales de fotografía', price: 200 },
  { id: '15', name: 'Redacción de contenido', description: 'Artículos, publicaciones y contenido web', price: 85 },
];

interface ItemsSectionProps {
  blocks: QuoteBlock[];
  onAddBlock: (block: QuoteBlock, index?: number) => void;
  onUpdateBlock: (blockId: string, content: Partial<QuoteBlock['content']>) => void;
  onRemoveBlock: (blockId: string) => void;
  currency?: string;
}

export function ItemsSection({
  blocks,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  currency = 'USD',
}: ItemsSectionProps) {
  const [addItemOpen, setAddItemOpen] = useState(false);

  // Filter to only service items
  const serviceItems = blocks.filter(
    (b): b is ServiceItemBlock => b.type === 'service-item'
  );

  const handleAddItem = () => {
    const newBlock = createBlock('service-item');
    onAddBlock(newBlock);
  };

  const handleAddSavedItem = (saved: typeof savedLineItems[number]) => {
    const newBlock = createBlock<ServiceItemBlock>('service-item', {
      name: saved.name,
      description: saved.description,
      rate: saved.price,
      quantity: 1,
    });
    onAddBlock(newBlock);
    setAddItemOpen(false);
  };

  const handleUpdateItem = (
    blockId: string,
    field: keyof ServiceItemBlock['content'],
    value: string | number
  ) => {
    onUpdateBlock(blockId, { [field]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Líneas de detalle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
            <div className="col-span-1"></div>
            <div className="col-span-4">CONCEPTO</div>
            <div className="col-span-2 text-right">PRECIO</div>
            <div className="col-span-2 text-right">CANT.</div>
            <div className="col-span-2 text-right">IMPORTE</div>
            <div className="col-span-1"></div>
          </div>

          <Separator />

          {/* Items */}
          {serviceItems.length > 0 ? (
            serviceItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-start group">
                <div className="col-span-1 flex items-center justify-center pt-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                </div>
                <div className="col-span-4">
                  <Input
                    placeholder="Nombre del concepto"
                    value={item.content.name}
                    onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="Descripción (opcional)"
                    className="mt-1 text-sm"
                    value={item.content.description}
                    onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="text-right"
                    value={item.content.rate || ''}
                    onChange={(e) => handleUpdateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    className="text-right"
                    value={item.content.quantity}
                    onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-2 text-right py-2 font-medium">
                  {formatCurrency(item.content.quantity * item.content.rate, currency)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={() => onRemoveBlock(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aún no hay conceptos</p>
              <p className="text-sm">Use el botón inferior para agregar el primer concepto</p>
            </div>
          )}

          {/* Add Items Dropdown */}
          <Popover open={addItemOpen} onOpenChange={setAddItemOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Agregar concepto
                <ChevronDown className="ml-2 h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0"
              align="start"
              style={{ width: 'var(--radix-popover-trigger-width)' }}
            >
              <Command>
                <CommandInput placeholder="Buscar conceptos guardados..." />
                <CommandList className="max-h-[280px]">
                  <CommandEmpty>No se encontraron conceptos.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        handleAddItem();
                        setAddItemOpen(false);
                      }}
                      className="py-2.5"
                    >
                      <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Concepto en blanco</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Conceptos guardados">
                    {savedLineItems.map((saved) => (
                      <CommandItem
                        key={saved.id}
                        value={saved.name}
                        onSelect={() => handleAddSavedItem(saved)}
                        className="py-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{saved.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{saved.description}</p>
                        </div>
                        {saved.price > 0 && (
                          <span className="ml-3 shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                            ${saved.price.toFixed(2)}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}
