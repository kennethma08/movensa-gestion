import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@grupomovensa.com';
const LOGO_URL = process.env.MOVENSA_LOGO_URL ||
  'https://oyvyplppabjbvuxfuvmd.supabase.co/storage/v1/object/public/oreko-files/logos/grupo-movensa-horizontal.webp';

const serviceCategories = [
  {
    name: 'Servicios tecnológicos',
    color: '#F57A1F',
    services: [
      ['Servicios de TI y soporte técnico', 'Atención, diagnóstico y solución de incidentes tecnológicos.'],
      ['Redes e infraestructura', 'Diseño, instalación, configuración y administración de redes.'],
      ['Desarrollo de software', 'Sistemas a la medida, automatizaciones, integraciones y chatbots.'],
      ['Sitios web', 'Diseño y desarrollo de sitios web rápidos, accesibles y optimizados.'],
    ],
  },
  {
    name: 'Equipos y mantenimiento',
    color: '#E8A648',
    services: [
      ['Mantenimiento preventivo', 'Revisión programada para reducir fallas y extender la vida útil de los equipos.'],
      ['Mantenimiento correctivo', 'Diagnóstico y reparación de fallas en equipos tecnológicos.'],
      ['Instalación de equipos', 'Preparación, instalación, configuración, pruebas y entrega operativa.'],
      ['Reacondicionamiento de equipos', 'Evaluación, actualización y puesta a punto de equipos para volver a utilizarlos.'],
    ],
  },
] as const;

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL.toLowerCase() },
    include: {
      workspaceMembers: {
        where: { role: 'owner' },
        include: { workspace: true },
        take: 1,
      },
    },
  });

  if (!user || !user.workspaceMembers[0]) {
    throw new Error(`No se encontró la cuenta propietaria ${ADMIN_EMAIL}`);
  }

  const workspaceId = user.workspaceMembers[0].workspaceId;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), locale: 'es-CR' },
    });

    await tx.workspace.update({
      where: { id: workspaceId },
      data: {
        name: 'Grupo Movensa',
        slug: 'grupo-movensa',
        settings: {
          onboardingCompleted: true,
          currency: 'CRC',
          timezone: 'America/Costa_Rica',
          locale: 'es-CR',
        },
      },
    });

    await tx.businessProfile.upsert({
      where: { workspaceId },
      update: {
        businessName: 'Grupo Movensa',
        logoUrl: LOGO_URL,
        email: 'info@grupomovensa.com',
        phone: '+506 6103-8511',
        website: 'https://grupomovensa.com',
        address: {
          city: 'Dulce Nombre',
          state: 'Cartago',
          postalCode: '30109',
          country: 'Costa Rica',
        },
        currency: 'CRC',
        timezone: 'America/Costa_Rica',
        locale: 'es-CR',
        emailSignature: 'Grupo Movensa | Nos movemos con la tecnología',
        clientEmail: 'info@grupomovensa.com',
      },
      create: {
        workspaceId,
        businessName: 'Grupo Movensa',
        logoUrl: LOGO_URL,
        email: 'info@grupomovensa.com',
        phone: '+506 6103-8511',
        website: 'https://grupomovensa.com',
        address: {
          city: 'Dulce Nombre',
          state: 'Cartago',
          postalCode: '30109',
          country: 'Costa Rica',
        },
        currency: 'CRC',
        timezone: 'America/Costa_Rica',
        locale: 'es-CR',
        emailSignature: 'Grupo Movensa | Nos movemos con la tecnología',
        clientEmail: 'info@grupomovensa.com',
      },
    });

    await tx.brandingSettings.upsert({
      where: { workspaceId },
      update: {
        primaryColor: '#F57A1F',
        secondaryColor: '#232323',
        accentColor: '#FF7E1C',
        logoUrl: LOGO_URL,
        fontFamily: 'Lexend',
      },
      create: {
        workspaceId,
        primaryColor: '#F57A1F',
        secondaryColor: '#232323',
        accentColor: '#FF7E1C',
        logoUrl: LOGO_URL,
        fontFamily: 'Lexend',
      },
    });

    await tx.numberSequence.upsert({
      where: { workspaceId_type: { workspaceId, type: 'quote' } },
      update: { prefix: 'COT-', padding: 4 },
      create: { workspaceId, type: 'quote', prefix: 'COT-', currentValue: 0, padding: 4 },
    });

    await tx.numberSequence.upsert({
      where: { workspaceId_type: { workspaceId, type: 'invoice' } },
      update: { prefix: 'FAC-', padding: 4 },
      create: { workspaceId, type: 'invoice', prefix: 'FAC-', currentValue: 0, padding: 4 },
    });

    for (const [categoryIndex, categoryData] of serviceCategories.entries()) {
      const category = await tx.rateCardCategory.upsert({
        where: { workspaceId_name: { workspaceId, name: categoryData.name } },
        update: { color: categoryData.color, sortOrder: categoryIndex },
        create: {
          workspaceId,
          name: categoryData.name,
          color: categoryData.color,
          sortOrder: categoryIndex,
        },
      });

      for (const [name, description] of categoryData.services) {
        const existing = await tx.rateCard.findFirst({ where: { workspaceId, name } });
        if (existing) {
          await tx.rateCard.update({
            where: { id: existing.id },
            data: { categoryId: category.id, description, isActive: true },
          });
        } else {
          await tx.rateCard.create({
            data: {
              workspaceId,
              categoryId: category.id,
              name,
              description,
              pricingType: 'fixed',
              rate: 0,
              unit: 'servicio',
            },
          });
        }
      }
    }
  }, { maxWait: 10_000, timeout: 60_000 });

  console.log('Configuración inicial de Grupo Movensa aplicada correctamente.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
