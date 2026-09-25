import "server-only";
import { db } from "@/lib/db";

/** Templates and audience sizes the campaign form needs. */
export async function campaignFormData() {
  const [templates, all, tags] = await Promise.all([
    db.template.findMany({
      where: { category: { not: "AUTHENTICATION" } },
      select: { id: true, name: true, category: true, status: true },
      orderBy: { name: "asc" },
    }),
    db.customer.count({ where: { optedOut: false } }),
    db.$queryRaw<{ tag: string; n: bigint }[]>`
      SELECT unnest(tags) AS tag, count(*) AS n FROM "Customer" WHERE "optedOut" = false GROUP BY 1 ORDER BY 1`,
  ]);
  return { templates, audience: { all, tags: tags.map((t) => ({ tag: t.tag, n: Number(t.n) })) } };
}
