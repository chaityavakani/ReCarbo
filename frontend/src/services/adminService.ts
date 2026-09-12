import api from './api';
import { AdminOverviewData, Company, User, CO2Listing, QuoteRequest, Order, AuditLog } from '../types';

export const adminService = {
  // 1. Overview KPIs & Charts
  getOverview: async (): Promise<AdminOverviewData> => {
    const res = await api.get('/admin/overview');
    return res.data;
  },

  // 2. User Management
  getUsers: async (): Promise<User[]> => {
    const res = await api.get('/admin/users');
    return res.data.users;
  },

  updateUserStatus: async (userId: string, isSuspended: boolean): Promise<User> => {
    const res = await api.patch(`/admin/users/${userId}/status`, { isSuspended });
    return res.data.user;
  },

  // 3. Organization Verification & Trust Score
  getCompanies: async (): Promise<Company[]> => {
    const res = await api.get('/admin/companies');
    return res.data.companies;
  },

  verifyCompany: async (
    companyId: string,
    isVerified: boolean,
    verificationStatus?: string,
    verificationNotes?: string
  ): Promise<{ company: Company }> => {
    const res = await api.patch(`/admin/companies/${companyId}/verify`, {
      isVerified,
      verificationStatus,
      verificationNotes,
    });
    return res.data;
  },

  updateCompanyTrustScore: async (
    companyId: string,
    trustScore: number,
    reason?: string
  ): Promise<{ company: Company }> => {
    const res = await api.patch(`/admin/companies/${companyId}/trust-score`, {
      trustScore,
      reason,
    });
    return res.data;
  },

  // 4. Marketplace Governance
  getListings: async (): Promise<CO2Listing[]> => {
    const res = await api.get('/admin/listings');
    return res.data.listings;
  },

  moderateListing: async (
    listingId: string,
    status: string,
    adminReason?: string
  ): Promise<CO2Listing> => {
    const res = await api.patch(`/admin/listings/${listingId}/moderate`, {
      status,
      adminReason,
    });
    return res.data.listing;
  },

  getRfqs: async (): Promise<QuoteRequest[]> => {
    const res = await api.get('/admin/rfqs');
    return res.data.rfqs;
  },

  getOrders: async (): Promise<Order[]> => {
    const res = await api.get('/admin/orders');
    return res.data.orders;
  },

  // 5. Audit Trail Logs
  getAuditLogs: async (params?: {
    action?: string;
    entityType?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; logs: AuditLog[] }> => {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },
};
