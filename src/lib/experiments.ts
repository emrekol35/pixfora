import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheDeletePattern } from "@/lib/redis";

// ============================================================
// Server-Side A/B Test Assignment Engine
// ============================================================

const CACHE_TTL = 300; // 5 dakika

/** Deterministic hash — ayni visitorId + testId her zaman ayni sonuc verir */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // 32-bit integer'a donustur
  }
  return Math.abs(hash);
}

interface VariantInfo {
  id: string;
  name: string;
  isControl: boolean;
  config: unknown;
  trafficWeight: number;
}

interface AssignmentResult {
  variantId: string;
  variantName: string;
  isControl: boolean;
  config: unknown;
}

/**
 * Visitor'a deterministik varyant ata.
 * trafficPercent kontrolu: hash % 100 >= trafficPercent → test disinda (null doner)
 */
export function assignVariant(
  testId: string,
  visitorId: string,
  trafficPercent: number,
  variants: VariantInfo[]
): AssignmentResult | null {
  if (variants.length === 0) return null;

  // Traffic yüzdesi kontrolü
  const trafficHash = hashCode(`${visitorId}:traffic:${testId}`) % 100;
  if (trafficHash >= trafficPercent) return null;

  // Agirlikli varyant secimi
  const variantHash = hashCode(`${visitorId}:variant:${testId}`) % 100;
  const totalWeight = variants.reduce((sum, v) => sum + v.trafficWeight, 0);

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += (variant.trafficWeight / totalWeight) * 100;
    if (variantHash < cumulative) {
      return {
        variantId: variant.id,
        variantName: variant.name,
        isControl: variant.isControl,
        config: variant.config,
      };
    }
  }

  // Fallback: son varyant
  const last = variants[variants.length - 1];
  return {
    variantId: last.id,
    variantName: last.name,
    isControl: last.isControl,
    config: last.config,
  };
}

/**
 * Visitor icin tum aktif testlerin atamalarini getir.
 * Redis cache kullanir, yoksa DB'den oku + yeni atama yap.
 */
export async function getVisitorAssignments(
  visitorId: string,
  userId?: string | null
): Promise<
  Record<string, { variantId: string; variantName: string; config: unknown }>
> {
  // Cache'den dene
  const cacheKey = `exp:assignments:${visitorId}`;
  const cached = await cacheGet<
    Record<string, { variantId: string; variantName: string; config: unknown }>
  >(cacheKey);
  if (cached) return cached;

  // Aktif testleri bul
  const activeTests = await prisma.aBTest.findMany({
    where: { status: "RUNNING" },
    include: {
      variants: {
        orderBy: { isControl: "desc" }, // Kontrol grubu once
      },
    },
  });

  if (activeTests.length === 0) {
    await cacheSet(cacheKey, {}, CACHE_TTL);
    return {};
  }

  // Mevcut atamalari getir
  const existingAssignments = await prisma.aBTestAssignment.findMany({
    where: {
      visitorId,
      testId: { in: activeTests.map((t) => t.id) },
    },
    include: {
      variant: true,
    },
  });

  const assignmentMap = new Map(
    existingAssignments.map((a) => [a.testId, a])
  );

  const result: Record<
    string,
    { variantId: string; variantName: string; config: unknown }
  > = {};
  const newAssignments: Array<{
    testId: string;
    variantId: string;
    visitorId: string;
    userId: string | null;
  }> = [];

  for (const test of activeTests) {
    const existing = assignmentMap.get(test.id);

    if (existing) {
      // Mevcut atama
      result[test.name] = {
        variantId: existing.variant.id,
        variantName: existing.variant.name,
        config: existing.variant.config,
      };
    } else {
      // Yeni atama yap
      const assigned = assignVariant(
        test.id,
        visitorId,
        test.trafficPercent,
        test.variants.map((v) => ({
          id: v.id,
          name: v.name,
          isControl: v.isControl,
          config: v.config,
          trafficWeight: v.trafficWeight,
        }))
      );

      if (assigned) {
        result[test.name] = {
          variantId: assigned.variantId,
          variantName: assigned.variantName,
          config: assigned.config,
        };
        newAssignments.push({
          testId: test.id,
          variantId: assigned.variantId,
          visitorId,
          userId: userId || null,
        });
      }
    }
  }

  // Yeni atamalari DB'ye kaydet
  if (newAssignments.length > 0) {
    await prisma.aBTestAssignment.createMany({
      data: newAssignments,
      skipDuplicates: true,
    });
  }

  // Cache'e yaz
  await cacheSet(cacheKey, result, CACHE_TTL);

  return result;
}

/** Cache'i temizle (test baslat/duraklat/tamamla islemlerinde) */
export async function invalidateExperimentCache() {
  await cacheDeletePattern("exp:*");
}
