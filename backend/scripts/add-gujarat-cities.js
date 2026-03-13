import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const gujaratCities = [
  'Adalaj', 'Ahmedabad', 'Ahmedabad Cantonment', 'Ahwa', 'Alang', 'Alang-Sosiya', 'Alikherva', 'Amardad', 'Ambaji', 'Ambaliyasan',
  'Amboli', 'Amod', 'Amreli', 'Anand', 'Anandpar', 'Andada', 'Anjar', 'Anklav', 'Ankleshwar', 'Antaliya',
  'Antarjal', 'Arsodiya', 'Atul', 'Baben', 'Babra', 'Bagasara', 'Bajwa', 'Balasinor', 'Balitha', 'Baliyasan',
  'Bansda', 'Bantva', 'Bardoli', 'Bareja', 'Barwala', 'Bavla', 'Bayad', 'Becharaji', 'Bhabhar', 'Bhachau',
  'Bhadkodara', 'Bhagal', 'Bhagdawada', 'Bhalpara', 'Bhanvad', 'Bharthana Kosad', 'Bharuch', 'Bhat', 'Bhavnagar', 'Bhayavadar',
  'Bhilad', 'Bhiloda', 'Bholav', 'Bhuj', 'Bhurivel', 'Bilimora', 'Bodeli', 'Bopal', 'Boriavi', 'Borsad',
  'Botad', 'Chaklasi', 'Chalala', 'Chalthan', 'Chanasma', 'Chandrapur', 'Chanod', 'Chhapi', 'Chhapra', 'Chhatral',
  'Chhaya', 'Chhiri', 'Chhota Udaipur', 'Chikhli', 'Chiloda', 'Chorvad', 'Chotila', 'Dabhoi', 'Daheli', 'Dakor',
  'Damnagar', 'Dediapada', 'Deesa', 'Dehari', 'Dehgam', 'Deodar', 'Devgadh Baria', 'Devsar', 'Dhandhuka', 'Dhanera',
  'Dharampur', 'Dhasa', 'Dhola', 'Dholka', 'Dhoraji', 'Dhrangadhra', 'Dhrol', 'Digvijaygram', 'Dahod', 'Dwarka',
  'Freelandgunj', 'Gadhada', 'Gadkhol', 'Galpadar', 'Gamdi', 'Gandevi', 'Gandhidham', 'Gandhinagar', 'Gariadhar', 'Ghanteshvar',
  'Ghogha', 'Godhra', 'Gondal', 'Halol', 'Halvad', 'Harij', 'Himatnagar', 'Ichchhapor', 'Idar', 'Jafrabad',
  'Jambusar', 'Jamjodhpur', 'Jamnagar', 'Jasdan', 'Jetpur', 'Jetpur Navagadh', 'Jhadeshwar', 'Jhalod', 'Junagadh', 'Kabilpor',
  'Kadi', 'Kadodara', 'Kalavad', 'Kalol', 'Kandla', 'Kanjari', 'Kanodar', 'Kapadvanj', 'Karamsad', 'Karjan',
  'Kathlal', 'Katpar', 'Kavant', 'Keshod', 'Kevadiya', 'Khambhalia', 'Khambhat', 'Kharaghoda', 'Kheda', 'Khedbrahma',
  'Kheralu', 'Kim', 'Kodinar', 'Kosamba', 'Kotharia', 'Kutiyana', 'Lathi', 'Lilia', 'Limbdi', 'Lunawada',
  'Madhapar', 'Mahendranagar', 'Mehsana', 'Mahudha', 'Mahuva', 'Maliya', 'Malpur', 'Manavadar', 'Mandvi', 'Mangrol',
  'Mansa', 'Meghraj', 'Mehmedabad', 'Mithapur', 'Modasa', 'Morbi', 'Mundra', 'Nadiad', 'Nandej', 'Nandesari',
  'Navsari', 'Ode', 'Okha', 'Padra', 'Palanpur', 'Palej', 'Palitana', 'Pardi', 'Patan', 'Patdi',
  'Pethapur', 'Petlad', 'Porbandar', 'Prantij', 'Radhanpur', 'Rajkot', 'Rajpipla', 'Rajula', 'Ranavav', 'Ranoli',
  'Ranpur', 'Rapar', 'Raval', 'Sachin', 'Sagbara', 'Saij', 'Salaya', 'Sanand', 'Sanjan', 'Santrampur',
  'Saputara', 'Sarigam', 'Savarkundla', 'Savli', 'Sayan', 'Shehera', 'Sidhpur', 'Sihor', 'Sikka', 'Sojitra',
  'Songadh', 'Surat', 'Surendranagar', 'Talaja', 'Talala', 'Talod', 'Thangadh', 'Thara', 'Tharad', 'Thasra',
  'Ukai', 'Umbergaon', 'Umreth', 'Una', 'Unjha', 'Upleta', 'Vadali', 'Vadnagar', 'Vadodara', 'Valsad',
  'Vanthali', 'Vapi', 'Vartej', 'Veraval', 'Vijalpor', 'Vijapur', 'Vijaynagar', 'Viramgam', 'Visavadar', 'Visnagar',
  'Vyara', 'Wadhwan', 'Waghai', 'Wankaner'
];

async function addGujaratCities() {
    console.log('Starting Gujarat cities migration...');
    console.log(`Total cities to add: ${gujaratCities.length}`);
    
    let addedCount = 0;
    let existingCount = 0;
    let errorCount = 0;
    
    try {
        for (const cityName of gujaratCities) {
            try {
                const result = await prisma.city.upsert({
                    where: { name: cityName.trim() },
                    update: { isActive: true },
                    create: { name: cityName.trim() }
                });
                
                // Check if it was created or updated
                const wasCreated = result.createdAt.getTime() === result.updatedAt.getTime();
                if (wasCreated) {
                    addedCount++;
                    console.log(`✅ Added: ${cityName}`);
                } else {
                    existingCount++;
                    console.log(`🔄 Already exists: ${cityName}`);
                }
            } catch (error) {
                errorCount++;
                console.error(`❌ Error adding ${cityName}:`, error.message);
            }
        }
        
        const finalCityCount = await prisma.city.count();
        
        console.log('\n📊 Migration Summary:');
        console.log(`✅ Cities added: ${addedCount}`);
        console.log(`🔄 Cities already existed: ${existingCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📈 Total cities in database: ${finalCityCount}`);
        console.log('\n🎉 Gujarat cities migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
addGujaratCities()
    .then(() => {
        console.log('✅ Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration script failed:', error);
        process.exit(1);
    });