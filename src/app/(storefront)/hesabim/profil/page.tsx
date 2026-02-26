export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProfileForm from "@/components/storefront/ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    select: { id: true, name: true, email: true, phone: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profil Ayarlari</h1>
      <ProfileForm user={user!} />
    </div>
  );
}
