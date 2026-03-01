import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ThemeEditorForm from "./ThemeEditorForm";

export default async function ThemeEditorPage() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/giris");
  }

  const settings = await prisma.setting.findMany({
    where: { group: "theme" },
  });

  const initialSettings: Record<string, string> = {};
  for (const s of settings) {
    initialSettings[s.key] = s.value;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tema Ayarlari</h1>
        <p className="text-muted-foreground mt-1">Magazanizin gorunumunu ozellestirin.</p>
      </div>
      <ThemeEditorForm initialSettings={initialSettings} />
    </div>
  );
}
