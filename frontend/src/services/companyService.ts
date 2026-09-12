import api from './api';
import { Company, TrustScoreBreakdown } from '../types';

export const companyService = {
  async getCompany(id: string): Promise<Company> {
    const { data } = await api.get<{ company: Company }>(`/companies/${id}`);
    return data.company;
  },

  async updateCompany(id: string, payload: Partial<Company>): Promise<Company> {
    const { data } = await api.put<{ company: Company }>(`/companies/${id}`, payload);
    return data.company;
  },

  async listCompanies(params?: { verified?: boolean; industry?: string }): Promise<Company[]> {
    const { data } = await api.get<{ companies: Company[] }>('/companies', { params });
    return data.companies;
  },

  async getTrustBreakdown(id: string): Promise<TrustScoreBreakdown> {
    const { data } = await api.get<{ trustBreakdown: TrustScoreBreakdown }>(`/companies/${id}/trust-breakdown`);
    return data.trustBreakdown;
  },

  async submitVerificationRequest(documents: any, notes?: string): Promise<Company> {
    const { data } = await api.post<{ company: Company }>('/companies/verify-request', {
      documents,
      notes,
    });
    return data.company;
  },

  async verifyCompany(id: string, isVerified: boolean, notes?: string): Promise<{ company: Company; trustBreakdown?: TrustScoreBreakdown }> {
    const { data } = await api.patch<{ company: Company; trustBreakdown?: TrustScoreBreakdown }>(`/companies/${id}/verify`, {
      isVerified,
      notes,
    });
    return data;
  },
};
