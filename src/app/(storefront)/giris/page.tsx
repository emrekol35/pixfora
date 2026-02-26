export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/storefront/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giris Yap | Pixfora",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/hesabim");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}
