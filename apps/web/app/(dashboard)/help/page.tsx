'use client';

import {
  BookOpen,
  MessageCircle,
  Mail,
  FileText,
  Video,
  ExternalLink,
  Lightbulb,
  Bug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const helpTopics = [
  {
    icon: FileText,
    title: 'Primeros pasos',
    description: 'Conozca el flujo para crear cotizaciones y facturas',
    href: '/help#getting-started',
  },
  {
    icon: BookOpen,
    title: 'Documentación',
    description: 'Guías de uso y referencias para integraciones',
    href: '/help#docs',
  },
  {
    icon: Video,
    title: 'Tutoriales',
    description: 'Aprenda cada proceso paso a paso',
    href: '/help#tutorials',
  },
  {
    icon: Lightbulb,
    title: 'Consejos prácticos',
    description: 'Aproveche mejor las herramientas de gestión',
    href: '/help#tips',
  },
];

const supportOptions = [
  {
    icon: MessageCircle,
    title: 'Chat en vivo',
    description: 'Canal de atención en preparación',
    action: 'Iniciar chat',
    available: false,
  },
  {
    icon: Mail,
    title: 'Soporte por correo',
    description: 'Envíe su consulta al equipo de Grupo Movensa',
    action: 'Enviar correo',
    href: 'mailto:info@grupomovensa.com',
    available: true,
  },
  {
    icon: Bug,
    title: 'Reportar un problema',
    description: 'Indique qué ocurrió y cómo podemos reproducirlo',
    action: 'Reportar problema',
    href: 'mailto:info@grupomovensa.com?subject=Reporte%20del%20sistema%20de%20gesti%C3%B3n',
    available: true,
  },
];

const faqs = [
  {
    question: '¿Cómo creo una cotización?',
    answer: 'Abra Cotizaciones en el menú lateral, seleccione Nueva cotización, elija el cliente, agregue los conceptos y guarde el documento. Después podrá enviarlo o descargarlo.',
  },
  {
    question: '¿Puedo convertir una cotización en factura?',
    answer: 'Sí. Cuando la cotización esté aceptada puede convertirla en factura y el sistema trasladará automáticamente el cliente, los conceptos y los importes.',
  },
  {
    question: '¿Cómo configuro los pagos en línea?',
    answer: 'Abra Configuración > Pagos. Si las credenciales de Stripe están habilitadas, podrá vincular la cuenta y recibir pagos desde las facturas.',
  },
  {
    question: '¿Puedo personalizar los documentos?',
    answer: 'Sí. En Configuración puede definir la marca, los colores, los datos comerciales y el logotipo que aparecerán en cotizaciones, contratos y facturas.',
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ayuda y soporte</h1>
        <p className="text-muted-foreground">
          Encuentre respuestas, conozca los procesos y contacte al equipo de soporte.
        </p>
      </div>

      {/* Low #78: Added IDs for anchor navigation from help topic links */}
      <section id="getting-started">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Recursos</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {helpTopics.map((topic) => (
            <a
              key={topic.title}
              href={topic.href}
              className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <topic.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{topic.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{topic.description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section id="tips">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Preguntas frecuentes</h2>
        <div className="rounded-lg border">
          <Accordion type="single" collapsible className="px-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className={index === faqs.length - 1 ? 'border-b-0' : ''}>
                <AccordionTrigger className="text-sm hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Support Options */}
      <section id="docs">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Obtener soporte</h2>
        <div className="rounded-lg border divide-y">
          {supportOptions.map((option) => (
            <div key={option.title} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <option.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{option.title}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
              {option.available ? (
                option.href ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={option.href} target="_blank" rel="noopener noreferrer">
                      {option.action}
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm">{option.action}</Button>
                )
              ) : (
                <span className="text-xs text-muted-foreground">Próximamente</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
