import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function logActivity(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Prisma.InputJsonValue | null;
}): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        ...(params.details && { details: params.details }),
      },
    });
  } catch (error) {
    console.error("Aktivite log kaydedilemedi:", error);
  }
}
