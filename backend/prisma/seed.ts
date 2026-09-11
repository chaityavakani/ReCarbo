import { PrismaClient, UserRole, TransactionMode, ListingStatus, RequirementStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ReCarbo database seeding...');

  // Clean existing records in sequence (to respect foreign keys)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.calculation.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.order.deleteMany();
  await prisma.match.deleteMany();
  await prisma.cO2Requirement.deleteMany();
  await prisma.cO2Listing.deleteMany();
  await prisma.platformFee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // Default hashed password for demo accounts
  const salt = await bcrypt.genSalt(10);
  const demoPasswordHash = await bcrypt.hash('password123', salt);

  // 1. Create Companies (Gujarat Industrial Clusters)
  const supplierCompany1 = await prisma.company.create({
    data: {
      name: 'Gujarat Carbon Capture Ltd',
      industry: 'Chemicals & Refining',
      description: 'Industrial post-combustion and amine absorption CO2 capture facility located in Bharuch Chemical Hub.',
      address: 'Plot 42, GIDC Dahej Industrial Area',
      city: 'Bharuch',
      state: 'Gujarat',
      pincode: '392130',
      latitude: 21.7051,
      longitude: 72.9959,
      website: 'https://gujaratcarbon.demo',
      contactEmail: 'contact@gujaratcarbon.demo',
      contactPhone: '+91 98250 11223',
      isVerified: true,
      trustScore: 94.5,
    },
  });

  const supplierCompany2 = await prisma.company.create({
    data: {
      name: 'Hazira Green Synthesis',
      industry: 'Fertilizer & Ammonia',
      description: 'High-purity byproduct CO2 stream from ammonia synthesis plant in Hazira industrial belt.',
      address: 'Sector 5, Hazira Port Road',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '394270',
      latitude: 21.1702,
      longitude: 72.8311,
      website: 'https://haziragreen.demo',
      contactEmail: 'sales@haziragreen.demo',
      contactPhone: '+91 98250 44556',
      isVerified: true,
      trustScore: 97.0,
    },
  });

  const buyerCompany1 = await prisma.company.create({
    data: {
      name: 'Aura Polymer Materials',
      industry: 'Polymer Manufacturing',
      description: 'Polycarbonate and sustainable polymer manufacturing utilizing CO2 as copolymer feed.',
      address: 'Block C, Sanand Industrial Zone',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382110',
      latitude: 23.0225,
      longitude: 72.5714,
      website: 'https://aurapolymer.demo',
      contactEmail: 'procurement@aurapolymer.demo',
      contactPhone: '+91 98250 77889',
      isVerified: true,
      trustScore: 91.0,
    },
  });

  const buyerCompany2 = await prisma.company.create({
    data: {
      name: 'Vadodara Eco-Concrete Works',
      industry: 'Cement & Building Materials',
      description: 'Advanced CO2 mineral carbonation curing facility for high-strength precast concrete.',
      address: 'Highway 8, Nandesari GIDC',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '391340',
      latitude: 22.3072,
      longitude: 73.1812,
      website: 'https://vadodaraconcrete.demo',
      contactEmail: 'supply@vadodaraconcrete.demo',
      contactPhone: '+91 98250 99001',
      isVerified: true,
      trustScore: 89.5,
    },
  });

  const adminCompany = await prisma.company.create({
    data: {
      name: 'ReCarbo Platform Operations',
      industry: 'Climate Tech SaaS',
      description: 'Core marketplace operations, verification authority and logistics clearing house.',
      address: 'Nanpura Tech Hub',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395001',
      latitude: 21.1702,
      longitude: 72.8311,
      website: 'https://recarbo.demo',
      contactEmail: 'admin@recarbo.demo',
      contactPhone: '+91 98000 00001',
      isVerified: true,
      trustScore: 100.0,
    },
  });

  console.log('🏢 Demo Companies created in Gujarat.');

  // 2. Create Demo Users (Supplier, Buyer, Admin)
  const supplierUser = await prisma.user.create({
    data: {
      email: 'supplier@recarbo.demo',
      name: 'Rajesh Patel (Supplier Lead)',
      password: demoPasswordHash,
      role: UserRole.SUPPLIER,
      companyId: supplierCompany1.id,
    },
  });

  const buyerUser = await prisma.user.create({
    data: {
      email: 'buyer@recarbo.demo',
      name: 'Ananya Sharma (Buyer Procurement)',
      password: demoPasswordHash,
      role: UserRole.BUYER,
      companyId: buyerCompany1.id,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@recarbo.demo',
      name: 'Smit Bhalani (Platform Admin)',
      password: demoPasswordHash,
      role: UserRole.ADMIN,
      companyId: adminCompany.id,
    },
  });

  console.log('👤 Demo Users created with password "password123":');
  console.log('   - supplier@recarbo.demo (SUPPLIER)');
  console.log('   - buyer@recarbo.demo (BUYER)');
  console.log('   - admin@recarbo.demo (ADMIN)');

  // 3. Create Demo CO2 Listings (Bharuch & Hazira)
  const listing1 = await prisma.cO2Listing.create({
    data: {
      supplierCompanyId: supplierCompany1.id,
      title: 'High-Purity Liquid CO2 (99.8%) - Dahej Stream',
      description: 'Continuous high-purity food/pharmaceutical grade liquid CO2 from amine absorption unit. Suitable for polymer synthesis, beverage carbonation, and chemical manufacturing.',
      quantityAvailableKg: 50000, // 50 Tonnes
      minOrderKg: 2000, // 2 Tonnes
      purityPercentage: 99.8,
      captureMethod: 'Post-Combustion Amine Capture',
      stateOfMatter: 'Liquid',
      pressureBar: 20.0,
      temperatureC: -20.0,
      pricePerKg: 4.5, // ₹4.5/kg = ₹4,500/tonne
      isSplitAllowed: true,
      transactionMode: TransactionMode.FIXED_PRICE,
      status: ListingStatus.ACTIVE,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const listing2 = await prisma.cO2Listing.create({
    data: {
      supplierCompanyId: supplierCompany2.id,
      title: 'Bulk Compressed Gas CO2 (98.5%) - Hazira Chemical Hub',
      description: 'Industrial grade pressurized gaseous CO2 suitable for mineral carbonation, concrete curing, and pH neutralization.',
      quantityAvailableKg: 120000, // 120 Tonnes
      minOrderKg: 5000, // 5 Tonnes
      purityPercentage: 98.5,
      captureMethod: 'Syngas Byproduct Separation',
      stateOfMatter: 'Compressed Gas',
      pressureBar: 15.0,
      temperatureC: 25.0,
      pricePerKg: 3.2, // ₹3.2/kg = ₹3,200/tonne
      isSplitAllowed: true,
      transactionMode: TransactionMode.REQUEST_QUOTE,
      status: ListingStatus.ACTIVE,
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('📦 Demo CO2 Listings created.');

  // 4. Create Demo Buyer CO2 Requirements
  const requirement1 = await prisma.cO2Requirement.create({
    data: {
      buyerCompanyId: buyerCompany1.id,
      title: 'Monthly Liquid CO2 Procurement for Polycarbonate Feedstock',
      description: 'Requires high-purity liquid CO2 delivered in refrigerated road tankers to Sanand plant.',
      quantityRequiredKg: 30000, // 30 Tonnes
      minPurityPercentage: 99.5,
      maxPricePerKg: 5.0,
      preferredState: 'Liquid',
      targetDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: RequirementStatus.OPEN,
    },
  });

  const requirement2 = await prisma.cO2Requirement.create({
    data: {
      buyerCompanyId: buyerCompany2.id,
      title: 'Industrial Grade CO2 for Concrete Carbonation Curing',
      description: 'Bulk delivery to Vadodara precast yard for accelerated CO2 curing.',
      quantityRequiredKg: 45000, // 45 Tonnes
      minPurityPercentage: 98.0,
      maxPricePerKg: 3.8,
      preferredState: 'Compressed Gas',
      targetDeliveryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: RequirementStatus.OPEN,
    },
  });

  console.log('🎯 Demo CO2 Requirements created.');

  // 5. Create Deterministic Match Example (Listing 1 <-> Requirement 1)
  // Distance Bharuch -> Ahmedabad ~190 km
  await prisma.match.create({
    data: {
      listingId: listing1.id,
      requirementId: requirement1.id,
      overallScore: 92.5,
      quantityScore: 95.0, // 50T supply comfortably covers 30T demand
      purityScore: 100.0,  // 99.8% exceeds 99.5% requirement
      distanceScore: 82.0, // ~190km route
      priceScore: 90.0,    // ₹4.5/kg below buyer's ₹5.0 max budget
      availabilityScore: 95.0,
      explanation: 'Optimal match: Dahej facility offers 99.8% purity (exceeds 99.5% minimum) with 50,000 kg supply against 30,000 kg demand at ₹4.50/kg (under ₹5.00 budget) across a 190 km transit route in Gujarat.',
      status: 'ACTIVE',
    },
  });

  // 6. Create Platform Fee & Settings Record
  await prisma.platformFee.create({
    data: {
      feePercentage: 2.5,
      transportRatePerKmKg: 0.015,
      updatedByUserId: adminUser.id,
    },
  });

  // 7. Create Demo Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: buyerUser.id,
        title: 'New AI Match Available (92.5%)',
        message: 'Gujarat Carbon Capture Ltd posted 50,000 kg Liquid CO2 matching your Polycarbonate Feedstock requirement.',
        type: 'MATCH_FOUND',
        linkUrl: '/marketplace',
        isRead: false,
      },
      {
        userId: supplierUser.id,
        title: 'Listing Activated',
        message: 'Your listing "High-Purity Liquid CO2 (99.8%)" is now active on the marketplace.',
        type: 'SYSTEM_ALERT',
        linkUrl: '/listings',
        isRead: true,
      },
      {
        userId: adminUser.id,
        title: 'Platform System Health',
        message: 'Marketplace operational with 2 active listings and 2 verified companies.',
        type: 'SYSTEM_ALERT',
        linkUrl: '/admin',
        isRead: false,
      }
    ]
  });

  // 8. Create Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'PLATFORM_SEEDED',
        entityType: 'System',
        entityId: 'seed',
        details: 'Initial Gujarat industrial cluster demo data populated successfully.',
        ipAddress: '127.0.0.1',
      },
      {
        userId: supplierUser.id,
        action: 'LISTING_CREATED',
        entityType: 'CO2Listing',
        entityId: listing1.id,
        details: 'Created listing 50,000 kg Liquid CO2 at ₹4.5/kg',
        ipAddress: '127.0.0.1',
      }
    ]
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
