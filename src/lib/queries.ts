import type { Prisma } from "@prisma/client";

export const MESSAGE_STATUSES = ["QUEUED", "SENT", "DELIVERED", "READ", "FAILED", "SKIPPED"] as const;

export function messageWhere(p: { q?: string; status?: string; campaign?: string; range?: string }): Prisma.MessageWhereInput {
  const where: Prisma.MessageWhereInput = {};
  if (p.status && (MESSAGE_STATUSES as readonly string[]).includes(p.status)) where.status = p.status as never;
  if (p.campaign === "test") where.runId = null;
  else if (p.campaign) where.run = { campaignId: p.campaign };
  const days = { "1d": 1, "7d": 7, "30d": 30 }[p.range ?? ""];
  if (days) where.createdAt = { gte: new Date(Date.now() - days * 86_400_000) };
  const q = p.q?.trim();
  if (q) {
    where.OR = [
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { phone: { contains: q.replace(/\D/g, "") || q } } },
      { templateName: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}
