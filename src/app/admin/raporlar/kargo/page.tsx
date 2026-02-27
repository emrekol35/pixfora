import ShippingReport from "./ShippingReport";

export const dynamic = "force-dynamic";

export default function ShippingReportPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kargo Performansi Raporu</h1>
      <ShippingReport />
    </div>
  );
}
