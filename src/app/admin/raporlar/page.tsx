export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import ReportDashboard from "./ReportDashboard";

async function getReportStats() {
  const [totalOrders, revenueAggregate, totalCustomers, totalProducts] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
      }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count(),
    ]);

  return {
    totalOrders,
    totalRevenue: revenueAggregate._sum.total || 0,
    totalCustomers,
    totalProducts,
  };
}

export default async function ReportsPage() {
  const stats = await getReportStats();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Raporlar</h1>
      <ReportDashboard
        totalOrders={stats.totalOrders}
        totalRevenue={stats.totalRevenue}
        totalCustomers={stats.totalCustomers}
        totalProducts={stats.totalProducts}
      />
    </div>
  );
}
