"use client";

import dynamic from "next/dynamic";
import { useCustomerReport } from "@/hooks/useReportData";
import StatCard from "@/components/admin/StatCard";
import { formatCurrency } from "@/lib/utils";

const RevenueLineChart = dynamic(
  () => import("@/components/admin/charts/RevenueLineChart"),
  { ssr: false }
);
const BarChartHorizontal = dynamic(
  () => import("@/components/admin/charts/BarChartHorizontal"),
  { ssr: false }
);
const StatusPieChart = dynamic(
  () => import("@/components/admin/charts/StatusPieChart"),
  { ssr: false }
);

interface Customer {
  id: string | null;
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  avgOrder: number;
}

export default function CustomerAnalytics() {
  const { data, isLoading } = useCustomerReport({ limit: 30 });

  const stats = data?.stats || {
    totalUsers: 0,
    usersWithOrders: 0,
    repeatCustomers: 0,
    highValueCustomers: 0,
    orderPercentage: 0,
    repeatPercentage: 0,
  };
  const customers: Customer[] = data?.customers || [];
  const registrationTrend = data?.registrationTrend || [];
  const orderFrequency = data?.orderFrequency || [];

  // Yeni vs Tekrar pie data
  const newVsRepeatData = [
    {
      name: "Tek Siparisli",
      value: stats.usersWithOrders - stats.repeatCustomers,
      color: "#3b82f6",
    },
    {
      name: "Tekrar Eden",
      value: stats.repeatCustomers,
      color: "#22c55e",
    },
  ];

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Yukleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ozet Kartlari */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Toplam Kayitli Musteri"
          value={stats.totalUsers.toLocaleString("tr-TR")}
          icon={<span className="text-lg">👥</span>}
          color="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          label="Siparis Veren %"
          value={`${stats.orderPercentage}%`}
          icon={<span className="text-lg">🛒</span>}
          color="bg-green-500/10 text-green-600"
        />
        <StatCard
          label="Tekrar Eden %"
          value={`${stats.repeatPercentage}%`}
          icon={<span className="text-lg">🔄</span>}
          color="bg-purple-500/10 text-purple-600"
        />
        <StatCard
          label="Yuksek Degerli"
          value={stats.highValueCustomers.toLocaleString("tr-TR")}
          icon={<span className="text-lg">💎</span>}
          color="bg-orange-500/10 text-orange-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kayit Trendi */}
        {registrationTrend.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              Kayit Trendi (Son 90 Gun)
            </h2>
            <RevenueLineChart
              data={registrationTrend}
              height={280}
              showOrders={false}
            />
          </div>
        )}

        {/* Yeni vs Tekrar Pie */}
        {stats.usersWithOrders > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              Yeni vs Tekrar Eden Musteriler
            </h2>
            <StatusPieChart
              data={newVsRepeatData}
              height={280}
              innerRadius={40}
              outerRadius={90}
            />
          </div>
        )}
      </div>

      {/* Siparis Frekans Dagilimi */}
      {orderFrequency.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            Siparis Frekans Dagilimi
          </h2>
          <BarChartHorizontal
            data={orderFrequency}
            height={250}
            layout="vertical"
          />
        </div>
      )}

      {/* Top Musteriler Tablosu */}
      {customers.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">
              En Degerli Musteriler ({customers.length})
            </h2>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted z-10">
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground w-12">
                    #
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                    Musteri
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                    E-posta
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                    Siparis
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                    Ort. Siparis
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                    Toplam Harcama
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr
                    key={customer.id || index}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-3 text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-6 py-3 font-medium">
                      {customer.name || "Isimsiz"}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {customer.email}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {customer.orderCount}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {formatCurrency(customer.avgOrder)} TL
                    </td>
                    <td className="px-6 py-3 text-right font-medium">
                      {formatCurrency(customer.totalSpent)} TL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
