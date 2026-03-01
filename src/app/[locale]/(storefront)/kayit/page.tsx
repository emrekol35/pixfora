export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/storefront/RegisterForm";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("registerMetaTitle"),
    description: t("registerMetaDesc"),
    robots: { index: false, follow: false },
  };
}

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/hesabim");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <RegisterForm />
    </div>
  );
}
