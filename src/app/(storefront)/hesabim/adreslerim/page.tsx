export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AddressManager from "@/components/storefront/AddressManager";

export default async function AddressesPage() {
  const session = await auth();

  const addresses = await prisma.address.findMany({
    where: { userId: session!.user!.id },
    orderBy: [{ isDefault: "desc" }, { title: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Adreslerim</h1>
      <AddressManager addresses={addresses} />
    </div>
  );
}
