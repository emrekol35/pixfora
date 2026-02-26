export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/storefront/RegisterForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kayit Ol | Pixfora",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/hesabim");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <RegisterForm />
    </div>
  );
}
