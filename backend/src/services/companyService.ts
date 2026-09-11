import { prisma } from '../utils/prisma';
import { createAuditLog } from './auditService';

export interface UpdateCompanyInput {
  name?: string;
  industry?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export class CompanyService {
  static async getCompanyById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        listings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        requirements: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            listings: true,
            requirements: true,
            ordersAsBuyer: true,
            ordersAsSupplier: true,
          },
        },
      },
    });

    if (!company) {
      const error: any = new Error('Company not found');
      error.statusCode = 404;
      error.code = 'COMPANY_NOT_FOUND';
      throw error;
    }

    return company;
  }

  static async updateCompany(id: string, input: UpdateCompanyInput, userId?: string) {
    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      const error: any = new Error('Company not found');
      error.statusCode = 404;
      error.code = 'COMPANY_NOT_FOUND';
      throw error;
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...input,
      },
    });

    await createAuditLog({
      userId,
      action: 'COMPANY_UPDATED',
      entityType: 'Company',
      entityId: id,
      details: input,
    });

    return updated;
  }

  static async getAllCompanies(options?: { isVerified?: boolean; industry?: string }) {
    return prisma.company.findMany({
      where: {
        ...(options?.isVerified !== undefined && { isVerified: options.isVerified }),
        ...(options?.industry && { industry: { contains: options.industry, mode: 'insensitive' } }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async verifyCompany(id: string, isVerified: boolean, trustScore?: number, adminUserId?: string) {
    const updated = await prisma.company.update({
      where: { id },
      data: {
        isVerified,
        ...(trustScore !== undefined && { trustScore }),
      },
    });

    await createAuditLog({
      userId: adminUserId,
      action: 'COMPANY_VERIFICATION_CHANGED',
      entityType: 'Company',
      entityId: id,
      details: { isVerified, trustScore },
    });

    return updated;
  }
}
