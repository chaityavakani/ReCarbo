import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export interface CreateAuditLogParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | object | null;
  ipAddress?: string | null;
}

export const createAuditLog = async (params: CreateAuditLogParams) => {
  try {
    const detailsStr = typeof params.details === 'object' 
      ? JSON.stringify(params.details) 
      : params.details;

    return await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        details: detailsStr || null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    return null;
  }
};
