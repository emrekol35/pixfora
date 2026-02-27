import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/Header";
import AdminQueryProvider from "@/components/admin/AdminQueryProvider";

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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-6 bg-muted/30">
          <AdminQueryProvider>{children}</AdminQueryProvider>
        </main>
      </div>
    </div>
  );
}
