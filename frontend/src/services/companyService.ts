import api from './api';
import { Company } from '../types';

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

  async verifyCompany(id: string, isVerified: boolean, trustScore?: number): Promise<Company> {
    const { data } = await api.patch<{ company: Company }>(`/companies/${id}/verify`, {
      isVerified,
      trustScore,
    });
    return data.company;
  },
};
