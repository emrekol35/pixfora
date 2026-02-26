export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import QuestionsManager from "./QuestionsManager";

export default async function AdminQuestionsPage() {
  const [questions, pendingCount] = await Promise.all([
    prisma.productQuestion.findMany({
      include: {
        user: { select: { name: true, email: true } },
        product: {
          select: {
            name: true,
            slug: true,
            images: { take: 1, select: { url: true } },
          },
        },
        answeredBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.productQuestion.count({
      where: { isPublished: false, answer: null },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sorular</h1>
          <p className="text-muted-foreground">
            Urun sorularini yonetin ve cevaplayin.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1 bg-warning/10 text-warning text-sm font-medium rounded-full">
            {pendingCount} bekleyen soru
          </span>
        )}
      </div>

      <QuestionsManager initialQuestions={questions} />
    </div>
  );
}
