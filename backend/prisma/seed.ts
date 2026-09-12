import { PrismaClient, UserRole, TransactionMode, ListingStatus, RequirementStatus, OrderStatus, PaymentStatus, NotificationType } from '@prisma/client';
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
      country: 'India',
      latitude: 21.7051,
      longitude: 72.9959,
      website: 'https://gujaratcarbon.demo',
      contactEmail: 'contact@gujaratcarbon.demo',
      contactPhone: '+91 98250 11223',
      isVerified: true,
      trustScore: 94.5,
      verificationStatus: 'VERIFIED',
      verificationDocs: JSON.stringify({
        gstin: '24AAACG1234F1Z5',
        isoCert: 'ISO-14064-GHG-2024',
        purityReport: 'GC-MS-99.8-CERT-2025',
      }),
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
      country: 'India',
      latitude: 21.1702,
      longitude: 72.8311,
      website: 'https://haziragreen.demo',
      contactEmail: 'sales@haziragreen.demo',
      contactPhone: '+91 98250 44556',
      isVerified: true,
      trustScore: 97.0,
      verificationStatus: 'VERIFIED',
      verificationDocs: JSON.stringify({
        gstin: '24AAAHZ9988E2Z1',
        isoCert: 'ISO-14064-GHG-2024',
        purityReport: 'AMMONIA-BYPRODUCT-98.5',
      }),
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
      country: 'India',
      latitude: 23.0225,
      longitude: 72.5714,
      website: 'https://aurapolymer.demo',
      contactEmail: 'procurement@aurapolymer.demo',
      contactPhone: '+91 98250 77889',
      isVerified: true,
      trustScore: 91.0,
      verificationStatus: 'VERIFIED',
      verificationDocs: JSON.stringify({
        gstin: '24AAACA5544D1Z8',
        gpcbClearance: 'GPCB-CTE-SANAND-2023',
      }),
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
      country: 'India',
      latitude: 22.3072,
      longitude: 73.1812,
      website: 'https://vadodaraconcrete.demo',
      contactEmail: 'supply@vadodaraconcrete.demo',
      contactPhone: '+91 98250 99001',
      isVerified: true,
      trustScore: 89.5,
      verificationStatus: 'VERIFIED',
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
      country: 'India',
      latitude: 21.1702,
      longitude: 72.8311,
      website: 'https://recarbo.demo',
      contactEmail: 'admin@recarbo.demo',
      contactPhone: '+91 98000 00001',
      isVerified: true,
      trustScore: 100.0,
      verificationStatus: 'VERIFIED',
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
      email: 'ravaldr30@gmail.com',
      name: 'Dhruvi Raval (Platform Admin)',
      password: await bcrypt.hash('Vakani@1234', await bcrypt.genSalt(10)),
      role: UserRole.ADMIN,
      companyId: adminCompany.id,
    },
  });

  console.log('👤 Demo Users created with password "password123":');
  console.log('   - supplier@recarbo.demo (SUPPLIER)');
  console.log('   - buyer@recarbo.demo (BUYER)');
  console.log('   - ravaldr30@gmail.com / Vakani@1234 (ADMIN)');

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
  await prisma.match.create({
    data: {
      listingId: listing1.id,
      requirementId: requirement1.id,
      overallScore: 92.5,
      quantityScore: 95.0,
      purityScore: 100.0,
      distanceScore: 82.0,
      priceScore: 90.0,
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

  // 7. Create Diverse Orders Across Different Status Stages (Order Lifecycle Demonstration)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'RC-2025-00124',
      listingId: listing1.id,
      buyerCompanyId: buyerCompany1.id,
      supplierCompanyId: supplierCompany1.id,
      quantityKg: 30000, // 30 Tonnes
      unitPricePerKg: 4.5,
      totalCo2Cost: 135000.0,
      transportCost: 30000 * 190 * 0.015, // ₹85,500
      handlingCost: 2500.0,
      platformFee: (135000.0 + 85500.0 + 2500.0) * 0.025, // ₹5,575
      totalAmount: 228575.0,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.ESCROW_HELD,
      deliveryAddress: 'Block C, Sanand Industrial Zone, Ahmedabad, Gujarat',
      routeDistanceKm: 190.0,
      transitMethod: 'Cryogenic Road Tanker',
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      notes: 'RFQ Best-Value allocation deal. Ready for cryo packaging.',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'RC-2025-00118',
      listingId: listing1.id,
      buyerCompanyId: buyerCompany2.id,
      supplierCompanyId: supplierCompany1.id,
      quantityKg: 20000, // 20 Tonnes
      unitPricePerKg: 4.5,
      totalCo2Cost: 90000.0,
      transportCost: 20000 * 85 * 0.015, // ₹25,500 (Dahej -> Vadodara ~85km)
      handlingCost: 2500.0,
      platformFee: (90000.0 + 25500.0 + 2500.0) * 0.025, // ₹2,950
      totalAmount: 120950.0,
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.ESCROW_HELD,
      deliveryAddress: 'Highway 8, Nandesari GIDC, Vadodara, Gujarat',
      routeDistanceKm: 85.0,
      transitMethod: 'Cryogenic Road Tanker',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Cryogenic pressure filling in progress at Dahej Terminal 3.',
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'RC-2025-00109',
      listingId: listing2.id,
      buyerCompanyId: buyerCompany1.id,
      supplierCompanyId: supplierCompany2.id,
      quantityKg: 25000, // 25 Tonnes
      unitPricePerKg: 3.2,
      totalCo2Cost: 80000.0,
      transportCost: 25000 * 260 * 0.015, // ₹97,500 (Hazira -> Sanand ~260km)
      handlingCost: 2500.0,
      platformFee: (80000.0 + 97500.0 + 2500.0) * 0.025, // ₹4,500
      totalAmount: 184500.0,
      status: OrderStatus.IN_TRANSIT,
      paymentStatus: PaymentStatus.ESCROW_HELD,
      trackingNumber: 'TRK-GUJ-88214',
      deliveryAddress: 'Block C, Sanand Industrial Zone, Ahmedabad, Gujarat',
      routeDistanceKm: 260.0,
      transitMethod: 'High-Pressure Gas Tube Trailer',
      estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      notes: 'En route on NH48. Live GPS telemetry active.',
    },
  });

  const order4 = await prisma.order.create({
    data: {
      orderNumber: 'RC-2025-00098',
      listingId: listing2.id,
      buyerCompanyId: buyerCompany2.id,
      supplierCompanyId: supplierCompany2.id,
      quantityKg: 50000, // 50 Tonnes
      unitPricePerKg: 3.2,
      totalCo2Cost: 160000.0,
      transportCost: 50000 * 155 * 0.015, // ₹116,250 (Hazira -> Vadodara ~155km)
      handlingCost: 2500.0,
      platformFee: (160000.0 + 116250.0 + 2500.0) * 0.025, // ₹6,968.75
      totalAmount: 285718.75,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.RELEASED,
      trackingNumber: 'TRK-GUJ-87650',
      deliveryAddress: 'Highway 8, Nandesari GIDC, Vadodara, Gujarat',
      routeDistanceKm: 155.0,
      transitMethod: 'High-Pressure Gas Tube Trailer',
      estimatedDelivery: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: 'Delivered and signed off at Vadodara reception bay. Escrow settled.',
    },
  });

  const order5 = await prisma.order.create({
    data: {
      orderNumber: 'RC-2025-00085',
      listingId: listing1.id,
      buyerCompanyId: buyerCompany1.id,
      supplierCompanyId: supplierCompany1.id,
      quantityKg: 30000, // 30 Tonnes
      unitPricePerKg: 4.5,
      totalCo2Cost: 135000.0,
      transportCost: 30000 * 190 * 0.015,
      handlingCost: 2500.0,
      platformFee: 5575.0,
      totalAmount: 228575.0,
      status: OrderStatus.UTILIZED,
      paymentStatus: PaymentStatus.RELEASED,
      deliveryAddress: 'Block C, Sanand Industrial Zone, Ahmedabad, Gujarat',
      routeDistanceKm: 190.0,
      transitMethod: 'Cryogenic Road Tanker',
      estimatedDelivery: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      notes: '100% incorporated into polymer synthesis batch. Carbon credits minted.',
    },
  });

  console.log('🚚 Seeded 5 Realistic Orders across Lifecycle Stages (CONFIRMED, PROCESSING, IN_TRANSIT, DELIVERED, UTILIZED).');

  // 8. Create Demo Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: buyerUser.id,
        title: 'New AI Match Available (92.5%)',
        message: 'Gujarat Carbon Capture Ltd posted 50,000 kg Liquid CO2 matching your Polycarbonate Feedstock requirement.',
        type: NotificationType.MATCH_FOUND,
        linkUrl: '/marketplace',
        isRead: false,
      },
      {
        userId: buyerUser.id,
        title: 'CO2 Shipment Dispatched (In-Transit)',
        message: 'Order RC-2025-00109 has been dispatched from Hazira via High-Pressure Gas Trailer. Tracking: TRK-GUJ-88214.',
        type: NotificationType.ORDER_STATUS_CHANGED,
        linkUrl: '/orders',
        isRead: false,
      },
      {
        userId: buyerUser.id,
        title: 'Quote Allocated (30.0 Tonnes)',
        message: 'Your quote on "High-Purity Liquid CO2 (99.8%)" was allocated. Order RC-2025-00124 is now confirmed.',
        type: NotificationType.QUOTE_ACCEPTED,
        linkUrl: '/orders',
        isRead: true,
      },
      {
        userId: supplierUser.id,
        title: 'Order Confirmed: RC-2025-00124',
        message: 'Aura Polymer Materials confirmed procurement of 30 Tonnes CO2. Escrow payment held.',
        type: NotificationType.ORDER_PLACED,
        linkUrl: '/orders',
        isRead: false,
      },
      {
        userId: supplierUser.id,
        title: 'Order Delivered: RC-2025-00098',
        message: 'Vadodara Eco-Concrete Works confirmed receipt. Escrow funds (₹1,60,000) released to your account.',
        type: NotificationType.ORDER_DELIVERED,
        linkUrl: '/orders',
        isRead: true,
      },
      {
        userId: adminUser.id,
        title: 'Platform System Health',
        message: 'Marketplace operational with 5 transactions and ₹8.6L gross turnover across Gujarat industrial hub.',
        type: NotificationType.SYSTEM_ALERT,
        linkUrl: '/admin/overview',
        isRead: false,
      },
    ],
  });

  // 9. Create Initial Audit Logs
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
        action: 'ORDER_STATUS_CONFIRMED',
        entityType: 'Order',
        entityId: order1.id,
        details: JSON.stringify({ orderNumber: order1.orderNumber, status: 'CONFIRMED' }),
        ipAddress: '127.0.0.1',
      },
      {
        userId: buyerUser.id,
        action: 'ORDER_STATUS_UTILIZED',
        entityType: 'Order',
        entityId: order5.id,
        details: JSON.stringify({ orderNumber: order5.orderNumber, status: 'UTILIZED' }),
        ipAddress: '127.0.0.1',
      },
    ],
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
