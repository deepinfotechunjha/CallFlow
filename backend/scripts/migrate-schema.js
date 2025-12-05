const { execSync } = require('child_process');

console.log('Applying schema changes...');

try {
  // Generate Prisma client with new schema
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Push schema changes to database
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('✅ Schema migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}