import 'dotenv/config';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient} from '../generated/prisma/client';

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL!});
const prismaClient = new PrismaClient({adapter});

async function main()
{
    // ─── Legal Branches ───────────────────────────────────────────────────────────
    const branches = [
        {name: 'Derecho Civil',           slug: 'civil',           icon: 'Scale',     sortOrder: 1},
        {name: 'Derecho Comercial',        slug: 'comercial',       icon: 'Buildings', sortOrder: 2},
        {name: 'Derecho Laboral',          slug: 'laboral',         icon: 'Users',     sortOrder: 3},
        {name: 'Derecho Procesal',         slug: 'procesal',        icon: 'Hammer',    sortOrder: 4},
        {name: 'Derecho Administrativo',   slug: 'administrativo',  icon: 'Building',  sortOrder: 5},
        {name: 'Derecho Penal',            slug: 'penal',           icon: 'Shield',    sortOrder: 6},
    ];

    for (const branch of branches)
    {
        const existing = await prismaClient.legalBranch.findFirst({where: {slug: branch.slug, firmId: null}});
        if (!existing)
        {
            await prismaClient.legalBranch.create({data: {...branch, isSystem: true, firmId: null}});
            console.log(`Rama creada: ${branch.name}`);
        }
        else
        {
            console.log(`Rama ya existe: ${branch.name}`);
        }
    }

    // ─── Subscription Plans ───────────────────────────────────────────────────────
    const plans = [
        {
            name:               'basic',
            displayName:        'Básico',
            description:        'Para abogados que están comenzando su práctica digital.',
            priceMonthly:       49900,
            priceAnnually:      39920,
            maxDocuments:       20,
            maxUsers:           1,
            maxTemplates:       5,
            maxAiTokensDaily:   19000,
            maxAiTokensWeekly:  94000,
            maxAiTokensMonthly: 300000,
            features: [
                '20 documentos por mes',
                '1 usuario',
                '5 plantillas personalizadas',
                'Exportación PDF y DOCX',
                'Soporte por email',
            ],
            isActive:  true,
            sortOrder: 1,
        },
        {
            name:               'business',
            displayName:        'Business',
            description:        'Para despachos en crecimiento que necesitan más potencia.',
            priceMonthly:       249900,
            priceAnnually:      199920,
            maxDocuments:       100,
            maxUsers:           5,
            maxTemplates:       20,
            maxAiTokensDaily:   75000,
            maxAiTokensWeekly:  375000,
            maxAiTokensMonthly: 1300000,
            features: [
                '100 documentos por mes',
                '5 usuarios',
                '20 plantillas personalizadas',
                'Biblioteca jurídica con IA (50 documentos)',
                'Asistente Legalito IA',
                'Exportación PDF y DOCX',
                'Soporte prioritario',
            ],
            isActive:  true,
            sortOrder: 2,
        },
        {
            name:               'empresarial',
            displayName:        'Empresarial',
            description:        'Para firmas establecidas con equipos grandes y alto volumen.',
            priceMonthly:       799900,
            priceAnnually:      639920,
            maxDocuments:       500,
            maxUsers:           25,
            maxTemplates:       100,
            maxAiTokensDaily:   280000,
            maxAiTokensWeekly:  1500000,
            maxAiTokensMonthly: 5600000,
            features: [
                '500 documentos por mes',
                '25 usuarios',
                '100 plantillas personalizadas',
                'Biblioteca jurídica ilimitada con IA',
                'Asistente Legalito IA',
                'Firma digital integrada',
                'Análisis y reportes avanzados',
                'Soporte dedicado 24/7',
            ],
            isActive:  true,
            sortOrder: 3,
        },
    ];

    for (const plan of plans)
    {
        await prismaClient.subscriptionPlan.upsert({
            where:  {name: plan.name},
            update: {
                displayName:        plan.displayName,
                description:        plan.description,
                priceMonthly:       plan.priceMonthly,
                priceAnnually:      plan.priceAnnually,
                maxDocuments:       plan.maxDocuments,
                maxUsers:           plan.maxUsers,
                maxTemplates:       plan.maxTemplates,
                maxAiTokensDaily:   plan.maxAiTokensDaily,
                maxAiTokensWeekly:  plan.maxAiTokensWeekly,
                maxAiTokensMonthly: plan.maxAiTokensMonthly,
                features:           plan.features,
                isActive:           plan.isActive,
                sortOrder:          plan.sortOrder,
            },
            create: {...plan},
        });
        console.log(`Plan upserted: ${plan.displayName}`);
    }

    console.log('Seed completado');
}

main()
    .catch(console.error)
    .finally(() => prismaClient.$disconnect());
