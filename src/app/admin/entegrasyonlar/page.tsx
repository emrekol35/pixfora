export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import IntegrationManager from "./IntegrationManager";

export default async function IntegrationsPage() {
  const integrations = await prisma.integration.findMany({
    orderBy: { service: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Entegrasyonlar</h1>
      <IntegrationManager
        integrations={integrations.map((i) => ({
          ...i,
          config: i.config as Record<string, string> | null,
        }))}
      />
    </div>
  );
}
