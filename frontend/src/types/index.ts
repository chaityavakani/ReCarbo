export type UserRole = 'SUPPLIER' | 'BUYER' | 'ADMIN';

export type ListingStatus = 'ACTIVE' | 'PENDING_REVIEW' | 'PAUSED' | 'SOLD_OUT' | 'EXPIRED';
export type TransactionMode = 'FIXED_PRICE' | 'REQUEST_QUOTE';
export type RequirementStatus = 'OPEN' | 'MATCHED' | 'FULFILLED' | 'CANCELLED';
export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'IN_TRANSIT' | 'DELIVERED' | 'UTILIZED' | 'CANCELLED' | 'DRAFT';

export type NotificationType =
  | 'MATCH_FOUND'
  | 'QUOTE_RECEIVED'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED'
  | 'ORDER_PLACED'
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_DELIVERED'
  | 'PAYMENT_RECEIVED'
  | 'SYSTEM_ALERT'
  | 'VERIFICATION_UPDATE'
  | 'AI_RECOMMENDATION';

export interface Company {
  id: string;
  name: string;
  industry: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  website?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isVerified: boolean;
  trustScore: number;
  verificationStatus?: string;
  verificationDocs?: string | null;
  verificationNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    listings?: number;
    requirements?: number;
    ordersAsBuyer?: number;
    ordersAsSupplier?: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string | null;
  company?: Company | null;
  isSuspended?: boolean;
  createdAt: string;
  unreadNotificationsCount?: number;
}

export interface CO2Listing {
  id: string;
  supplierCompanyId: string;
  supplierCompany: Company;
  title: string;
  description?: string | null;
  quantityAvailableKg: number;
  minOrderKg: number;
  purityPercentage: number;
  captureMethod: string;
  stateOfMatter: string;
  pressureBar?: number | null;
  temperatureC?: number | null;
  pricePerKg: number;
  isSplitAllowed: boolean;
  transactionMode: TransactionMode;
  status: ListingStatus;
  expiryDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CO2Requirement {
  id: string;
  buyerCompanyId: string;
  buyerCompany: Company;
  title: string;
  description?: string | null;
  quantityRequiredKg: number;
  minPurityPercentage: number;
  maxPricePerKg?: number | null;
  preferredState?: string | null;
  targetDeliveryDate?: string | null;
  status: RequirementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MatchBreakdown {
  id: string;
  listingId: string;
  listing: CO2Listing;
  requirementId: string;
  requirement: CO2Requirement;
  overallScore: number;
  quantityScore: number;
  purityScore: number;
  distanceScore: number;
  priceScore: number;
  availabilityScore: number;
  explanation?: string | null;
  status: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  listingId?: string | null;
  listing?: CO2Listing | null;
  buyerCompanyId: string;
  buyerCompany: Company;
  supplierCompanyId: string;
  supplierCompany: Company;
  quantityKg: number;
  unitPricePerKg: number;
  totalCo2Cost: number;
  transportCost: number;
  handlingCost: number;
  platformFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: string;
  deliveryAddress?: string | null;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  routeDistanceKm?: number | null;
  transitMethod?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

export interface TrustFactor {
  id: string;
  name: string;
  weight: number;
  score: number;
  contribution: number;
  description: string;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'UNVERIFIED';
}

export interface TrustScoreBreakdown {
  companyId: string;
  companyName: string;
  isVerified: boolean;
  verificationStatus: string;
  overallScore: number;
  grade: 'AAA' | 'AA' | 'A' | 'BBB' | 'UNRATED';
  summary: string;
  factors: TrustFactor[];
  lastCalculatedAt: string;
}

export interface SupplierAnalytics {
  totalRevenue: number;
  realizedRevenue: number;
  escrowInFlightRevenue: number;
  totalVolumeSoldTonnes: number;
  totalVolumeSoldKg: number;
  totalVolumeDeliveredTonnes: number;
  activeSupplyInventoryTonnes: number;
  avgRealizedPricePerKg: number;
  avgQuotePriceReceived: number;
  totalRfqs: number;
  allocatedRfqs: number;
  rfqConversionRate: number;
  topBuyers: Array<{
    companyId: string;
    name: string;
    city: string;
    volumeKg: number;
    totalSpend: number;
    orderCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    volumeTonnes: number;
    orders: number;
  }>;
  activeOrdersCount: number;
  deliveredOrdersCount: number;
}

export interface BuyerAnalytics {
  totalSpend: number;
  totalVolumePurchasedTonnes: number;
  totalVolumePurchasedKg: number;
  totalVolumeUtilizedTonnes: number;
  totalVolumeUtilizedKg: number;
  totalDemandTonnes: number;
  avgPricePerKg: number;
  costSavingsAmount: number;
  costAvoidancePercent: number;
  topSuppliers: Array<{
    companyId: string;
    name: string;
    city: string;
    volumeKg: number;
    totalSpend: number;
    avgPurity: number;
    orderCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    spend: number;
    volumeTonnes: number;
    orders: number;
  }>;
  statusCounts: Record<string, number>;
  activeOrdersCount: number;
  requirementsCount: number;
}

export type AllocationPolicy = 'FCFS' | 'HIGHEST_PRICE' | 'BEST_VALUE';

export interface Quote {
  id: string;
  quoteRequestId: string;
  quoteRequest?: QuoteRequest;
  buyerCompanyId: string;
  buyerCompany: Company;
  offeredQuantityKg: number;
  offeredPricePerKg: number;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  id: string;
  quoteRequestId: string;
  quoteId: string;
  quote: Quote;
  allocatedQuantityKg: number;
  agreedPricePerKg: number;
  allocationStatus: string;
  createdAt: string;
}

export interface QuoteRequest {
  id: string;
  listingId: string;
  listing: CO2Listing;
  requirementId?: string | null;
  requirement?: CO2Requirement | null;
  status: 'OPEN' | 'EVALUATING' | 'ALLOCATED' | 'CLOSED';
  deadline: string;
  allocationPolicy: AllocationPolicy;
  quotes?: Quote[];
  allocations?: Allocation[];
  createdAt: string;
  updatedAt: string;
}

export interface AIMatchResult {
  listingId: string;
  requirementId: string;
  overallScore: number;
  quantityScore: number;
  purityScore: number;
  distanceScore: number;
  priceScore: number;
  availabilityScore: number;
  explanation: string;
  isEligible: boolean;
  distanceKm: number;
  estimatedLandedCost: {
    co2Cost: number;
    transportCost: number;
    handlingCost: number;
    platformFee: number;
    totalAmount: number;
    costPerKg: number;
  };
  listing: CO2Listing;
  requirement?: CO2Requirement;
}

export interface PlatformSettings {
  id: string;
  feePercentage: number;
  transportRatePerKmKg: number;
  minQuoteIncrement?: number;
  defaultRfqHours?: number;
  requireDocsForVerify?: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface AdminOverviewKPIs {
  totalUsers: number;
  supplierUsersCount: number;
  buyerUsersCount: number;
  totalCompanies: number;
  totalListings: number;
  activeListingsCount: number;
  totalRequirements: number;
  activeRfqsCount: number;
  totalOrdersCount: number;
  completedOrdersCount: number;
  inTransitOrdersCount: number;
  activeVolumeKg: number;
  activeVolumeTonnes: number;
  totalVolumeSoldTonnes: number;
  totalVolumeDeliveredTonnes: number;
  totalVolumeUtilizedTonnes: number;
  platformRevenue: number;
  grossMerchandiseValue: number;
  avgCo2PricePerKg: number;
  platformFeePercentage: number;
  transportRate: number;
}

export interface CarbonFlowStage {
  stage: string;
  tonnes: number;
  color: string;
}

export interface AdminOverviewData {
  kpis: AdminOverviewKPIs;
  carbonFlow: CarbonFlowStage[];
  monthlyTrends: Array<{
    month: string;
    volumeTonnes: number;
    revenue: number;
    gmv: number;
    orders: number;
  }>;
  userGrowth: Array<{
    month: string;
    suppliers: number;
    buyers: number;
    total: number;
  }>;
  priceByState: Array<{
    state: string;
    avgPrice: number;
    purityAvg: number;
    count: number;
  }>;
}

export interface SustainabilityMetricsData {
  totalCapturedTonnes: number;
  totalListedTonnes: number;
  totalMatchedTonnes: number;
  totalTransportedTonnes: number;
  totalUtilizedTonnes: number;
  totalTransactions: number;
  totalCostSavings: number;
  virginBenchmarkRate: number;
  carbonFlowSteps: Array<{
    id: string;
    stage: string;
    tonnes: number;
    kg: number;
    description: string;
    color: string;
  }>;
  sectors: Array<{
    name: string;
    percent: number;
    tonnes: number;
    mechanism: string;
    color: string;
  }>;
  regionalHubs: Array<{
    hub: string;
    type: string;
    volumeTonnes: number;
    captureMethod: string;
    purity: string;
  }>;
  monthlyCumulative: Array<{
    month: string;
    routedTonnes: number;
    transactions: number;
    costSavingsINR: number;
  }>;
  complianceStatement: string;
}

export interface AssistantStructuredMatch {
  listingId: string;
  title: string;
  supplierName: string;
  supplierCity: string;
  purityPercentage: number;
  quantityAvailableTonnes: number;
  pricePerKg: number;
  stateOfMatter: string;
  captureMethod: string;
  distanceKm: number;
  landedCostEstimate: number;
  landedCostPerKg: number;
  overallScore: number;
  scores: {
    quantity: number;
    purity: number;
    distance: number;
    price: number;
    availability: number;
  };
}

export interface AssistantChatResponse {
  reply: string;
  actionType: 'MATCH_RECOMMENDATION' | 'SUPPLIER_COMPARISON' | 'UTILIZATION_ADVICE' | 'GENERAL_QA';
  generatedByAI?: boolean;
  structuredData?: {
    matches?: AssistantStructuredMatch[];
    comparison?: any;
    filtersParsed?: any;
    utilizationTip?: any;
  };
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: { id: string; name: string; email: string; role: string } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}


