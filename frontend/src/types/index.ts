export type UserRole = 'SUPPLIER' | 'BUYER' | 'ADMIN';

export type ListingStatus = 'ACTIVE' | 'PENDING_REVIEW' | 'PAUSED' | 'SOLD_OUT' | 'EXPIRED';
export type TransactionMode = 'FIXED_PRICE' | 'REQUEST_QUOTE';
export type RequirementStatus = 'OPEN' | 'MATCHED' | 'FULFILLED' | 'CANCELLED';
export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED';
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

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
  verificationDocs?: string | null;
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
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

export interface PlatformSettings {
  id: string;
  feePercentage: number;
  transportRatePerKmKg: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
}
