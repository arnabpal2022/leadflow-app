import { db } from '../src/lib/db';
import { users, buyers } from '../src/lib/db/schema';

async function seed() {
  console.log('Seeding database...');

  // Create a demo user
  const [demoUser] = await db.insert(users).values({
    name: 'Demo User',
    email: 'demo@example.com',
    role: 'admin',
  }).returning();

  console.log('Created demo user:', demoUser.email);

  // Create some sample buyers
  const sampleBuyers = [
    {
      fullName: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      phone: '9876543210',
      city: 'Chandigarh' as const,
      propertyType: 'Apartment' as const,
      bhk: '2' as const,
      purpose: 'Buy' as const,
      budgetMin: 4000000,
      budgetMax: 6000000,
      timeline: '0-3m' as const,
      source: 'Website' as const,
      status: 'New' as const,
      notes: 'Looking for a 2BHK apartment in a good locality',
      tags: JSON.stringify(['first-time-buyer', 'urgent']),
      ownerId: demoUser.id,
    },
    {
      fullName: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9876543211',
      city: 'Mohali' as const,
      propertyType: 'Villa' as const,
      bhk: '3' as const,
      purpose: 'Buy' as const,
      budgetMin: 8000000,
      budgetMax: 12000000,
      timeline: '3-6m' as const,
      source: 'Referral' as const,
      status: 'Qualified' as const,
      notes: 'Interested in villas with garden space',
      tags: JSON.stringify(['luxury', 'family']),
      ownerId: demoUser.id,
    },
    {
      fullName: 'Amit Singh',
      phone: '9876543212',
      city: 'Zirakpur' as const,
      propertyType: 'Plot' as const,
      purpose: 'Buy' as const,
      budgetMin: 2000000,
      budgetMax: 3000000,
      timeline: '>6m' as const,
      source: 'Walk-in' as const,
      status: 'Contacted' as const,
      notes: 'Looking for residential plot for future construction',
      tags: JSON.stringify(['investment']),
      ownerId: demoUser.id,
    },
  ];

  const insertedBuyers = await db.insert(buyers).values(sampleBuyers).returning();
  
  console.log(`Created ${insertedBuyers.length} sample buyers`);
  console.log('Seeding completed!');
}

seed().catch(console.error);