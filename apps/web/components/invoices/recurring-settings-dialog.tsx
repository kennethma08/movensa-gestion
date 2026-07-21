'use client';

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  updateRecurringSettings,
  getRecurringSettings,
} from '@/lib/invoices/recurring';

export interface RecurringSettings {
  enabled: boolean;
  frequency: string;
  startDate: string;
  endDate: string | null;
  noEndDate: boolean;
  autoSend: boolean;
}

interface RecurringSettingsDialogProps {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional initial settings passed from server component. If not provided, settings are fetched on open. */
  initialSettings?: RecurringSettings | null;
  onSave?: (settings: RecurringSettings) => void;
}

const frequencies = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

function getDefaults(): RecurringSettings {
  return {
    enabled: false,
    frequency: 'monthly',
    startDate: new Date().toISOString(),
    endDate: null,
    noEndDate: true,
    autoSend: false,
  };
}

export function RecurringSettingsDialog({
  invoiceId,
  open,
  onOpenChange,
  initialSettings,
  onSave,
}: RecurringSettingsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [noEndDate, setNoEndDate] = useState(true);
  const [autoSend, setAutoSend] = useState(false);

  // Load settings from server when dialog opens
  useEffect(() => {
    if (!open) return;

    // If initial settings are passed from server component, use them
    if (initialSettings) {
      setEnabled(initialSettings.enabled);
      setFrequency(initialSettings.frequency);
      setStartDate(new Date(initialSettings.startDate));
      setEndDate(initialSettings.endDate ? new Date(initialSettings.endDate) : undefined);
      setNoEndDate(initialSettings.noEndDate);
      setAutoSend(initialSettings.autoSend);
      return;
    }

    // Otherwise, fetch from server
    setIsLoading(true);
    getRecurringSettings(invoiceId)
      .then((settings) => {
        if (settings) {
          setEnabled(settings.enabled);
          setFrequency(settings.frequency);
          setStartDate(new Date(settings.startDate));
          setEndDate(settings.endDate ? new Date(settings.endDate) : undefined);
          setNoEndDate(settings.noEndDate);
          setAutoSend(settings.autoSend);
        } else {
          // Reset to defaults
          const defaults = getDefaults();
          setEnabled(defaults.enabled);
          setFrequency(defaults.frequency);
          setStartDate(new Date(defaults.startDate));
          setEndDate(undefined);
          setNoEndDate(defaults.noEndDate);
          setAutoSend(defaults.autoSend);
        }
      })
      .catch(() => {
        toast.error('No se pudo cargar la configuración recurrente');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [open, invoiceId, initialSettings]);

  const handleSave = async () => {
    setIsSaving(true);

    const settings: RecurringSettings = {
      enabled,
      frequency,
      startDate: startDate.toISOString(),
      endDate: noEndDate ? null : (endDate?.toISOString() ?? null),
      noEndDate,
      autoSend,
    };

    try {
      const result = await updateRecurringSettings(invoiceId, {
        enabled: settings.enabled,
        frequency: settings.frequency,
        startDate: settings.startDate,
        endDate: settings.endDate,
        autoSend: settings.autoSend,
      });

      if (result.success) {
        toast.success(
          settings.enabled
            ? 'Configuración recurrente guardada correctamente'
            : 'Recurrencia desactivada'
        );
        onSave?.(settings);
        onOpenChange(false);
      } else {
        toast.error(result.error || 'No se pudo guardar la configuración recurrente');
      }
    } catch {
      toast.error('No se pudo guardar la configuración recurrente');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Configuración recurrente
          </DialogTitle>
          <DialogDescription>
            Configure esta factura para generarla automáticamente según una frecuencia.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-5 py-4">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Activar recurrencia</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Genere esta factura automáticamente según la programación
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {enabled && (
              <>
                {/* Frequency */}
                <div className="grid gap-2">
                  <Label>Frecuencia</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione la frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="grid gap-2">
                  <Label>Fecha de inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'dd/MM/yyyy') : 'Seleccione una fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(d) => d && setStartDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div className="grid gap-2">
                  <Label>Fecha de finalización</Label>
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      id="no-end-date"
                      checked={noEndDate}
                      onCheckedChange={(checked) => setNoEndDate(!!checked)}
                    />
                    <label htmlFor="no-end-date" className="text-sm text-muted-foreground cursor-pointer">
                      Sin fecha de finalización
                    </label>
                  </div>
                  {!noEndDate && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !endDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'dd/MM/yyyy') : 'Seleccione una fecha final'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => date < startDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Auto-send */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enviar automáticamente al cliente</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Envíe la factura por correo al generarla
                    </p>
                  </div>
                  <Switch checked={autoSend} onCheckedChange={setAutoSend} />
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
