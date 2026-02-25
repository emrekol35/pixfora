export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import ReviewList from "./ReviewList";

async function getReviews() {
  return prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
  });
}

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Yorum Yonetimi</h1>
        <span className="text-sm text-muted-foreground">
          {reviews.filter((r) => !r.isApproved).length} yorum onay bekliyor
        </span>
      </div>
      <ReviewList reviews={reviews.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))} />
    </div>
  );
}
