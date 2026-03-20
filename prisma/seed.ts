import 'dotenv/config';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient} from '../generated/prisma/client';

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL!});
const prisma = new PrismaClient({adapter});

async function main()
{
    const branches = [
        {name: 'Derecho Civil', slug: 'civil', icon: 'Scale', sortOrder: 1},
        {name: 'Derecho Comercial', slug: 'comercial', icon: 'Buildings', sortOrder: 2},
        {name: 'Derecho Laboral', slug: 'laboral', icon: 'Users', sortOrder: 3},
        {name: 'Derecho Procesal', slug: 'procesal', icon: 'Hammer', sortOrder: 4},
        {name: 'Derecho Administrativo', slug: 'administrativo', icon: 'Building', sortOrder: 5},
        {name: 'Derecho Penal', slug: 'penal', icon: 'Shield', sortOrder: 6}
    ];

    for (const branch of branches) {
        const existing = await prisma.legalBranch.findFirst({
            where: {slug: branch.slug, firmId: null}
        });

        if (!existing) {
            await prisma.legalBranch.create({
                data: {...branch, isSystem: true, firmId: null}
            });
            console.log(`Rama creada: ${branch.name}`);
        } else {
            console.log(`Rama ya existe: ${branch.name}`);
        }
    }

    const existingPlan = await prisma.subscriptionPlan.findUnique({
        where: {name: 'basic'}
    });

    if (!existingPlan) {
        await prisma.subscriptionPlan.create({
            data: {
                name: 'basic',
                displayName: 'Plan Básico',
                description: 'Acceso completo durante la fase inicial del proyecto',
                priceMonthly: 0,
                maxDocuments: null,
                maxUsers: null,
                maxTemplates: null,
                features: ['Generación ilimitada de documentos', 'Todas las ramas del derecho', 'Exportación PDF y DOCX'],
                isActive: true,
                sortOrder: 1
            }
        });
        console.log('Plan básico creado');
    } else {
        console.log('Plan básico ya existe');
    }

    console.log('Seed completado');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
