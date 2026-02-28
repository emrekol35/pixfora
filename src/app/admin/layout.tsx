import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminQueryProvider from "@/components/admin/AdminQueryProvider";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata = {
  title: "Admin Paneli",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/giris");
  }

  if ((session.user as { role?: string }).role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayoutClient>
      <AdminQueryProvider>{children}</AdminQueryProvider>
    </AdminLayoutClient>
  );
}
