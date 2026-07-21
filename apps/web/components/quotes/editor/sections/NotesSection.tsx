'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface NotesSectionProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  internalNotes: string;
  onInternalNotesChange?: (internalNotes: string) => void;
}

export function NotesSection({ notes, onNotesChange, internalNotes, onInternalNotesChange }: NotesSectionProps) {
  return (
    <div className="space-y-6">
      {/* Client-facing Notes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Notas para el cliente</CardTitle>
          <CardDescription>
            These notes will be visible to the client on the quote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="notes" className="sr-only">Notas para el cliente</Label>
            <Textarea
              id="notes"
              placeholder="Gracias por considerarnos para su proyecto. Esperamos trabajar con usted."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Internal Notes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Notas internas</CardTitle>
          <CardDescription>
            Private notes for your team only - not visible to client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="internalNotes" className="sr-only">Notas internas</Label>
            <Textarea
              id="internalNotes"
              placeholder="Agregue notas internas sobre esta cotización..."
              value={internalNotes}
              onChange={(e) => onInternalNotesChange?.(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
