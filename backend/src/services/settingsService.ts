import { prisma } from '../utils/prisma';
import { createAuditLog } from './auditService';
import { broadcastEvent } from '../socket/socketHandler';
import { SOCKET_EVENTS } from '../socket/events';

export interface PlatformSettingsData {
  feePercentage: number;
  transportRatePerKmKg: number;
  minQuoteIncrement?: number;
  defaultRfqHours?: number;
  requireDocsForVerify?: boolean;
}

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
    const defaultIncrement = parseFloat(process.env.MIN_QUOTE_INCREMENT || '0.10');
    const defaultRfqHours = parseInt(process.env.DEFAULT_RFQ_HOURS || '48', 10);

    return {
      id: 'default',
      feePercentage: defaultFee,
      transportRatePerKmKg: defaultRate,
      minQuoteIncrement: defaultIncrement,
      defaultRfqHours: defaultRfqHours,
      requireDocsForVerify: true,
      effectiveFrom: new Date(),
      effectiveTo: null,
    };
  }

  static async updatePlatformFee(data: PlatformSettingsData, adminUserId: string) {
    // Expire current fee record
    await prisma.platformFee.updateMany({
      where: { effectiveTo: null },
      data: { effectiveTo: new Date() },
    });

    const newFee = await prisma.platformFee.create({
      data: {
        feePercentage: data.feePercentage,
        transportRatePerKmKg: data.transportRatePerKmKg,
        minQuoteIncrement: data.minQuoteIncrement ?? 0.10,
        defaultRfqHours: data.defaultRfqHours ?? 48,
        requireDocsForVerify: data.requireDocsForVerify ?? true,
        updatedByUserId: adminUserId,
      },
    });

    await createAuditLog({
      userId: adminUserId,
      action: 'PLATFORM_FEE_UPDATED',
      entityType: 'PlatformFee',
      entityId: newFee.id,
      details: data,
    });

    // Real-time broadcast to all connected clients
    broadcastEvent(SOCKET_EVENTS.SETTINGS_UPDATED, { settings: newFee });

    return newFee;
  }
}

