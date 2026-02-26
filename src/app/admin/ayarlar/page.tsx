export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import SettingsForm from "./SettingsForm";

async function getSettings() {
  return prisma.setting.findMany({ orderBy: { key: "asc" } });
}

export default async function SettingsPage() {
  const settings = await getSettings();

  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ayarlar</h1>
      <SettingsForm initialSettings={settingsMap} />
    </div>
  );
}
