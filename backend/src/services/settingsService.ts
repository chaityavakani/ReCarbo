import { prisma } from '../utils/prisma';
import { createAuditLog } from './auditService';

export class SettingsService {
  static async getActivePlatformFee() {
    try {
      const fee = await prisma.platformFee.findFirst({
        where: { effectiveTo: null },
        orderBy: { createdAt: 'desc' },
      });

      if (fee) return fee;
    } catch {
      // Fallback below
    }

    const defaultFee = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '2.5');
    const defaultRate = parseFloat(process.env.TRANSPORT_RATE || '0.015');
    return {
      id: 'default',
      feePercentage: defaultFee,
      transportRatePerKmKg: defaultRate,
      effectiveFrom: new Date(),
      effectiveTo: null,
    };
  }

  static async updatePlatformFee(feePercentage: number, transportRatePerKmKg: number, adminUserId: string) {
    // Expire current fee record
    await prisma.platformFee.updateMany({
      where: { effectiveTo: null },
      data: { effectiveTo: new Date() },
    });

    const newFee = await prisma.platformFee.create({
      data: {
        feePercentage,
        transportRatePerKmKg,
        updatedByUserId: adminUserId,
      },
    });

    await createAuditLog({
      userId: adminUserId,
      action: 'PLATFORM_FEE_UPDATED',
      entityType: 'PlatformFee',
      entityId: newFee.id,
      details: { feePercentage, transportRatePerKmKg },
    });

    return newFee;
  }
}
