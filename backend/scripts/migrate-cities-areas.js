import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCitiesAndAreas() {
    console.log('Starting cities and areas migration...');
    
    try {
        // Get unique cities from SalesEntry
        const salesCities = await prisma.salesEntry.findMany({
            select: { city: true },
            distinct: ['city']
        });
        
        console.log(`Found ${salesCities.length} unique cities in sales entries`);
        
        // Create cities
        const cityMap = new Map();
        for (const entry of salesCities) {
            if (entry.city && entry.city.trim()) {
                try {
                    const city = await prisma.city.upsert({
                        where: { name: entry.city.trim() },
                        update: { isActive: true },
                        create: { name: entry.city.trim() }
                    });
                    cityMap.set(entry.city.trim(), city.id);
                    console.log(`Created/updated city: ${city.name}`);
                } catch (error) {
                    console.error(`Error creating city ${entry.city}:`, error.message);
                }
            }
        }
        
        // Get all sales entries and filter in JavaScript
        const allSalesEntries = await prisma.salesEntry.findMany({
            select: { area: true, city: true }
        });
        
        // Filter entries that have both area and city
        const salesAreas = allSalesEntries.filter(entry => 
            entry.area && entry.area.trim() && entry.city && entry.city.trim()
        );
        
        console.log(`Found ${salesAreas.length} area entries in sales`);
        
        // Create areas
        const processedAreas = new Set();
        for (const entry of salesAreas) {
            if (entry.area && entry.area.trim() && entry.city && entry.city.trim()) {
                const areaKey = `${entry.area.trim()}-${entry.city.trim()}`;
                if (!processedAreas.has(areaKey)) {
                    const cityId = cityMap.get(entry.city.trim());
                    if (cityId) {
                        try {
                            const area = await prisma.area.upsert({
                                where: { 
                                    name_cityId: {
                                        name: entry.area.trim(),
                                        cityId: cityId
                                    }
                                },
                                update: { isActive: true },
                                create: { 
                                    name: entry.area.trim(),
                                    cityId: cityId
                                }
                            });
                            console.log(`Created/updated area: ${area.name} in ${entry.city}`);
                            processedAreas.add(areaKey);
                        } catch (error) {
                            console.error(`Error creating area ${entry.area} in ${entry.city}:`, error.message);
                        }
                    }
                }
            }
        }
        
        // Add some common default cities if none exist
        const cityCount = await prisma.city.count();
        if (cityCount === 0) {
            const defaultCities = [
                'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 
                'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'
            ];
            
            for (const cityName of defaultCities) {
                try {
                    await prisma.city.create({
                        data: { name: cityName }
                    });
                    console.log(`Created default city: ${cityName}`);
                } catch (error) {
                    console.error(`Error creating default city ${cityName}:`, error.message);
                }
            }
        }
        
        const finalCityCount = await prisma.city.count();
        const finalAreaCount = await prisma.area.count();
        
        console.log(`Migration completed successfully!`);
        console.log(`Total cities: ${finalCityCount}`);
        console.log(`Total areas: ${finalAreaCount}`);
        
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateCitiesAndAreas()
    .then(() => {
        console.log('Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });