export const dynamic = "force-dynamic";

import CouponForm from "../CouponForm";

export default function NewCouponPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Yeni Kupon</h1>
      <CouponForm />
    </div>
  );
}
